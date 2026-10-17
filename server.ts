import crypto from 'crypto';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { RoomManager } from './src/server/roomManager';
import { ButtonSyncPayload, GateSyncPayload, PlayerSyncPayload } from './src/types';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const httpServer = http.createServer(app);

  // Disable stack fingerprinting header
  app.disable('x-powered-by');

  // Parse JSON payloads with strict size limit to prevent memory bloat attacks
  app.use(express.json({ limit: '16kb' }));

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Enable CORS for frontend clients (e.g. GitHub Pages)
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Admin-Token');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (_origin, callback) => {
        // Explicitly accept all origins including GitHub Pages to prevent credentials CORS rejects
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e6, // 1MB payload ceiling
    allowEIO3: true,
    pingInterval: 10000,
    pingTimeout: 7000,
  });

  const roomManager = new RoomManager();

  // Rate Limiting & Brute-force Prevention Store
  const socketActionCounts = new Map<string, { count: number; resetTime: number }>();
  const adminFailedAttempts = new Map<string, { count: number; lockedUntil: number }>();

  function checkRateLimit(socketId: string, maxPerWindow: number = 8, windowMs: number = 10000): boolean {
    const now = Date.now();
    const record = socketActionCounts.get(socketId) || { count: 0, resetTime: now + windowMs };
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }
    record.count++;
    socketActionCounts.set(socketId, record);
    return record.count <= maxPerWindow;
  }

  function sanitizePlayerName(raw: any, fallback: string): string {
    if (typeof raw !== 'string') return fallback;
    const sanitized = raw.replace(/[^\p{L}\p{N}\s_.-]/gu, '').trim();
    return sanitized.slice(0, 16) || fallback;
  }

  function isValidRoomCode(code: any): boolean {
    return typeof code === 'string' && /^\d{6}$/.test(code.trim());
  }

  function isSocketInRoom(socket: any, roomCode: any): boolean {
    if (!roomCode || typeof roomCode !== 'string') return false;
    return socket.rooms.has(roomCode.trim());
  }

  /**
   * Constant-time timing-safe string comparison to protect against side-channel timing attacks
   */
  function timingSafeStringEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Server-side administrative authentication middleware.
   * Protects server management endpoints with ADMIN_SECRET / ADMIN_TOKEN environment variables.
   * Unauthenticated or unauthorized requests receive standard 401 or 403 responses.
   */
  function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();
    const ipRecord = adminFailedAttempts.get(clientIp);

    // Rate-limit brute-force attempts on admin secret
    if (ipRecord && ipRecord.count >= 5 && now < ipRecord.lockedUntil) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Too many failed administrative attempts. Access temporarily locked for 15 minutes.',
      });
    }

    const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_TOKEN;

    // If server owner has not set ADMIN_SECRET in Render environment, disable API-based administration
    if (!ADMIN_SECRET || !ADMIN_SECRET.trim()) {
      return res.status(403).json({
        error: 'Forbidden',
        message:
          'Server administration via API is not enabled. Manage environment variables, restarts, and deployment securely through the authenticated Render Dashboard.',
      });
    }

    const authHeader = req.headers.authorization;
    const customHeader = req.headers['x-admin-token'];
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (typeof customHeader === 'string') {
      token = customHeader.trim();
    }

    if (!token) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="Server Administration"');
      return res.status(401).json({
        error: 'Unauthorized',
        message:
          'Administrative authentication required. Provide Authorization: Bearer <ADMIN_SECRET> or X-Admin-Token header.',
      });
    }

    if (!timingSafeStringEqual(token, ADMIN_SECRET.trim())) {
      const current = adminFailedAttempts.get(clientIp) || { count: 0, lockedUntil: 0 };
      current.count++;
      if (current.count >= 5) {
        current.lockedUntil = now + 15 * 60 * 1000;
      }
      adminFailedAttempts.set(clientIp, current);

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid administrative credentials.',
      });
    }

    // Reset failed counter on successful authentication
    adminFailedAttempts.delete(clientIp);
    next();
  }

  // 1. Block destructive operations (shutdown, restart, config change) over HTTP
  // Even with admin tokens, these operations must be performed via the authenticated Render Dashboard.
  app.all(
    [
      '/shutdown',
      '/restart',
      '/api/admin/shutdown',
      '/api/admin/restart',
      '/api/admin/config*',
      '/api/admin/env*',
    ],
    (_req, res) => {
      res.status(403).json({
        error: 'Forbidden',
        message:
          'Direct server shutdown, restart, and environment changes over HTTP are disabled for security. Manage service lifecycle through the authenticated Render Dashboard.',
      });
    }
  );

  // 2. Authenticated Admin Diagnostic Status Endpoint
  app.get('/api/admin/status', requireAdminAuth, (_req, res) => {
    res.json({
      status: 'healthy',
      auth: 'authenticated',
      uptimeSeconds: Math.floor(process.uptime()),
      activeRooms: roomManager.getActiveRoomCount(),
      connectedSockets: io.engine.clientsCount,
      nodeVersion: process.version,
      memoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      timestamp: new Date().toISOString(),
    });
  });

  // 3. Authenticated Admin Room Summary Endpoint (NO private socket IDs or player IPs leaked)
  app.get('/api/admin/rooms', requireAdminAuth, (_req, res) => {
    res.json({
      activeRooms: roomManager.getActiveRoomCount(),
      rooms: roomManager.getRoomsSummary(),
      timestamp: new Date().toISOString(),
    });
  });

  // 4. Guard all generic admin, configuration, and environment paths
  app.all(['/admin*', '/config*', '/env*', '/.env*'], requireAdminAuth, (_req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'Administrative authentication verified. Use /api/admin/status for service diagnostics.',
    });
  });

  // 5. Safe Public API Health Endpoints (Strictly non-sensitive; never leaks paths, secrets, or env vars)
  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({
      status: 'ok',
      game: 'ELEMENTS: TWO SOULS',
      service: 'Multiplayer Socket.IO Server',
      onlinePlayers: io.engine.clientsCount,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/', (_req, res, next) => {
    // If client specifically asks for health or JSON, or root is requested on backend-only deployment
    if (_req.headers.accept?.includes('application/json') || process.env.NODE_ENV === 'production') {
      const distIndex = path.join(process.cwd(), 'dist', 'index.html');
      if (process.env.NODE_ENV === 'production') {
        const fs = require('fs');
        if (fs.existsSync(distIndex)) {
          return next();
        }
      }
      return res.json({
        status: 'ok',
        game: 'ELEMENTS: TWO SOULS',
        service: 'Multiplayer Socket.IO Server',
        onlinePlayers: io.engine.clientsCount,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  });

  // Socket.IO Multiplayer Event Handlers
  io.on('connection', (socket) => {
    // Defense-in-depth: Prohibit any administrative or debug socket commands
    socket.onAny((eventName, ...args) => {
      if (
        typeof eventName === 'string' &&
        (eventName.startsWith('admin') ||
          eventName.startsWith('server_') ||
          eventName.startsWith('config_') ||
          eventName === 'get_env' ||
          eventName === 'set_env' ||
          eventName === 'exec' ||
          eventName === 'eval')
      ) {
        const callback = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null;
        if (callback) {
          callback({ success: false, error: 'Unauthorized administrative operation' });
        }
      }
    });

    // 1. Create Room (Rate-limited & sanitized)
    socket.on('create_room', (data: { playerName?: string }, callback) => {
      if (!checkRateLimit(socket.id, 6, 15000)) {
        if (typeof callback === 'function') {
          callback({ success: false, error: '请求过于频繁，请稍候再试' });
        }
        return;
      }

      const cleanName = sanitizePlayerName(data?.playerName, 'Xinyi');
      const result = roomManager.createRoom(socket.id, cleanName);
      if (!result.success || !result.room || !result.player) {
        if (typeof callback === 'function') {
          callback({ success: false, error: result.error || '创建房间失败' });
        }
        return;
      }

      socket.join(result.room.roomCode);
      if (typeof callback === 'function') {
        callback({
          success: true,
          roomCode: result.room.roomCode,
          player: result.player,
          room: result.room,
        });
      }

      io.to(result.room.roomCode).emit('room_state_update', result.room);
    });

    // 2. Join Room (Validated 6-digit code & sanitized name)
    socket.on(
      'join_room',
      (data: { roomCode: string; playerName?: string }, callback) => {
        if (!checkRateLimit(socket.id, 10, 15000)) {
          if (typeof callback === 'function') {
            callback({ success: false, error: '请求过于频繁，请稍候再试' });
          }
          return;
        }

        if (!isValidRoomCode(data?.roomCode)) {
          if (typeof callback === 'function') {
            callback({ success: false, error: '房间代码格式不正确（须为 6 位数字）' });
          }
          return;
        }

        const cleanCode = data.roomCode.trim();
        const cleanName = sanitizePlayerName(data?.playerName, 'James');
        const result = roomManager.joinRoom(cleanCode, socket.id, cleanName);
        if (!result.success || !result.room || !result.player) {
          if (typeof callback === 'function') {
            callback({ success: false, error: result.error || '加入房间失败' });
          }
          return;
        }

        socket.join(result.room.roomCode);
        if (typeof callback === 'function') {
          callback({
            success: true,
            roomCode: result.room.roomCode,
            player: result.player,
            room: result.room,
          });
        }

        // Notify both players in room
        io.to(result.room.roomCode).emit('room_state_update', result.room);
      }
    );

    // 3. Ready State Toggle
    socket.on('set_ready', (data: { isReady: boolean }, callback) => {
      const { room, player } = roomManager.setPlayerReady(
        socket.id,
        data.isReady,
        (roomCode, seconds) => {
          io.to(roomCode).emit('countdown_tick', { seconds });
        },
        (roomCode) => {
          io.to(roomCode).emit('game_start', { roomCode });
        }
      );

      if (room && player) {
        if (typeof callback === 'function') {
          callback({ success: true, isReady: player.isReady });
        }
        io.to(room.roomCode).emit('room_state_update', room);
      } else {
        if (typeof callback === 'function') {
          callback({ success: false, error: '未找到所在房间' });
        }
      }
    });

    // 4. Real-time Player Physics & State Sync
    socket.on('sync_player', (payload: PlayerSyncPayload) => {
      if (!isSocketInRoom(socket, payload?.roomCode)) return;
      // Send directly to the other player in the room (low-latency UDP-like relay)
      socket.to(payload.roomCode).emit('remote_player_sync', payload);
    });

    // 4b. Authoritative Host World State Sync (moving platforms, bridges, boxes, etc.)
    socket.on('sync_world', (payload: any) => {
      if (!isSocketInRoom(socket, payload?.roomCode)) return;
      socket.to(payload.roomCode).emit('remote_world_sync', payload);
    });

    // 4c. Player Death & Checkpoint Respawn Synchronization
    socket.on('sync_death', (payload: any) => {
      if (!isSocketInRoom(socket, payload?.roomCode)) return;
      io.to(payload.roomCode).emit('remote_death_sync', payload);
    });

    // 4d. Collectible Gem Synchronization
    socket.on('sync_gem', (payload: any) => {
      if (!isSocketInRoom(socket, payload?.roomCode)) return;
      io.to(payload.roomCode).emit('remote_gem_sync', payload);
    });

    // 4e. Checkpoint Activation Synchronization
    socket.on('sync_checkpoint', (payload: any) => {
      if (!isSocketInRoom(socket, payload?.roomCode)) return;
      io.to(payload.roomCode).emit('remote_checkpoint_sync', payload);
    });

    // 4f. Round-trip Ping / Latency Measurement
    socket.on('client_ping', (timestamp: number, callback) => {
      if (typeof callback === 'function') {
        callback(timestamp);
      }
    });

    // 5. Button Press Sync & Authoritative Cooperative Gate Sync
    socket.on('sync_button', (payload: ButtonSyncPayload) => {
      if (!isSocketInRoom(socket, payload?.roomCode)) return;
      // Immediately relay button event to teammate
      socket.to(payload.roomCode).emit('remote_button_sync', payload);

      // Server calculates authoritative gate state if this was a gate button
      roomManager.updateButtonAndGate(
        payload.roomCode,
        payload.buttonId,
        payload.isPressed,
        (gatePayload) => {
          io.to(payload.roomCode).emit('remote_gate_sync', gatePayload);
        },
        payload.triggerTarget,
        payload.playerTarget
      );
    });

    // Client-side Gate State Sync (redundancy / host reconciliation)
    socket.on('sync_gate', (payload: GateSyncPayload) => {
      if (!isSocketInRoom(socket, payload?.roomCode)) return;
      socket.to(payload.roomCode).emit('remote_gate_sync', payload);
    });

    // 6. Level Restart Sync
    socket.on('restart_level', (data: { roomCode: string }) => {
      if (!isSocketInRoom(socket, data?.roomCode)) return;
      roomManager.resetGate(data.roomCode, (gatePayload) => {
        io.to(data.roomCode).emit('remote_gate_sync', gatePayload);
      });
      io.to(data.roomCode).emit('remote_restart_level', { triggeredBy: socket.id });
    });

    // 6b. Level Change Sync (Level 01 - 20)
    socket.on('change_level', (data: { roomCode: string; levelId: number }) => {
      if (!isSocketInRoom(socket, data?.roomCode)) return;
      if (!Number.isInteger(data?.levelId) || data.levelId < 1 || data.levelId > 20) return;
      const updatedRoom = roomManager.setLevel(data.roomCode, data.levelId);
      roomManager.resetGate(data.roomCode, (gatePayload) => {
        io.to(data.roomCode).emit('remote_gate_sync', gatePayload);
      });
      if (updatedRoom) {
        io.to(data.roomCode).emit('room_state_update', updatedRoom);
      }
      io.to(data.roomCode).emit('remote_change_level', { levelId: data.levelId });
    });

    // 7. Level Complete Sync
    socket.on('level_complete', (data: { roomCode: string }) => {
      if (!isSocketInRoom(socket, data?.roomCode)) return;
      io.to(data.roomCode).emit('remote_level_complete', {});
    });

    // 8. Leave Room
    socket.on('leave_room', () => {
      const res = roomManager.leaveRoom(socket.id);
      if (res.roomCode && res.room) {
        socket.leave(res.roomCode);
        io.to(res.roomCode).emit('room_state_update', res.room);
        io.to(res.roomCode).emit('teammate_disconnected', { playerId: res.playerId });
      }
    });

    // 9. Socket Disconnection Handling
    socket.on('disconnect', () => {
      socketActionCounts.delete(socket.id);
      const res = roomManager.handleDisconnect(socket.id);
      if (res.roomCode && res.room) {
        io.to(res.roomCode).emit('room_state_update', res.room);
        io.to(res.roomCode).emit('teammate_disconnected', {
          playerId: res.playerId,
          message: '队友连接已断开 (Teammate Disconnected)',
        });
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    const fs = await import('fs');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (_req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.json({
          status: 'ok',
          service: 'DUALITY: Bound by Elements Multiplayer Server',
          onlinePlayers: io.engine.clientsCount,
          frontend: 'https://xinyiloh027-arch.github.io/ELEMENTS-TWO-SOULS/',
        });
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`DUALITY Multiplayer Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
