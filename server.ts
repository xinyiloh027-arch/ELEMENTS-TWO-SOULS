import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { RoomManager } from './src/server/roomManager';
import { ButtonSyncPayload, GateSyncPayload, PlayerSyncPayload } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 8000,
    pingTimeout: 5000,
  });

  const roomManager = new RoomManager();

  // API Health Endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', onlinePlayers: io.engine.clientsCount });
  });

  // Socket.IO Multiplayer Event Handlers
  io.on('connection', (socket) => {
    // 1. Create Room
    socket.on('create_room', (data: { playerName?: string }, callback) => {
      const result = roomManager.createRoom(socket.id, data?.playerName);
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

    // 2. Join Room
    socket.on(
      'join_room',
      (data: { roomCode: string; playerName?: string }, callback) => {
        const result = roomManager.joinRoom(data.roomCode, socket.id, data?.playerName);
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
      if (!payload?.roomCode) return;
      // Send directly to the other player in the room (low-latency UDP-like relay)
      socket.to(payload.roomCode).emit('remote_player_sync', payload);
    });

    // 4b. Authoritative Host World State Sync (moving platforms, bridges, boxes, etc.)
    socket.on('sync_world', (payload: any) => {
      if (!payload?.roomCode) return;
      socket.to(payload.roomCode).emit('remote_world_sync', payload);
    });

    // 4c. Player Death & Checkpoint Respawn Synchronization
    socket.on('sync_death', (payload: any) => {
      if (!payload?.roomCode) return;
      io.to(payload.roomCode).emit('remote_death_sync', payload);
    });

    // 4d. Collectible Gem Synchronization
    socket.on('sync_gem', (payload: any) => {
      if (!payload?.roomCode) return;
      io.to(payload.roomCode).emit('remote_gem_sync', payload);
    });

    // 4e. Checkpoint Activation Synchronization
    socket.on('sync_checkpoint', (payload: any) => {
      if (!payload?.roomCode) return;
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
      if (!payload?.roomCode) return;
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
      if (!payload?.roomCode) return;
      socket.to(payload.roomCode).emit('remote_gate_sync', payload);
    });

    // 6. Level Restart Sync
    socket.on('restart_level', (data: { roomCode: string }) => {
      if (!data?.roomCode) return;
      roomManager.resetGate(data.roomCode, (gatePayload) => {
        io.to(data.roomCode).emit('remote_gate_sync', gatePayload);
      });
      io.to(data.roomCode).emit('remote_restart_level', { triggeredBy: socket.id });
    });

    // 6b. Level Change Sync (Level 01 - 10)
    socket.on('change_level', (data: { roomCode: string; levelId: number }) => {
      if (!data?.roomCode || !data?.levelId) return;
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
      if (!data?.roomCode) return;
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
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Twin Quest Multiplayer Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
