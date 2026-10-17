import { GateState, GateSyncPayload, PlayerId, RoomPlayer, RoomState } from '../types';
import { updateGateLogic } from '../game/gateLogic';

export interface ServerGateState {
  state: GateState;
  isOpen: boolean;
  openProgress: number;
  isUnlocked: boolean;
  minOpenTimer: number;
  releaseDelayTimer: number;
  bluePressed: boolean;
  redPressed: boolean;
  lastTickTime: number;
  intervalTimer?: NodeJS.Timeout;
}

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private socketToRoom: Map<string, { roomCode: string; playerId: PlayerId }> = new Map();
  private countdownTimers: Map<string, NodeJS.Timeout[]> = new Map();
  private roomGates: Map<string, ServerGateState> = new Map();

  // Generate a distinct 6-digit numeric room code
  public generateRoomCode(): string {
    let code = '';
    let attempts = 0;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      attempts++;
    } while (this.rooms.has(code) && attempts < 100);
    return code;
  }

  public getRoom(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode);
  }

  public getRoomBySocketId(socketId: string): { roomCode: string; playerId: PlayerId } | undefined {
    return this.socketToRoom.get(socketId);
  }

  public createRoom(socketId: string, playerName: string = 'Xinyi'): {
    success: boolean;
    room?: RoomState;
    player?: RoomPlayer;
    error?: string;
  } {
    // Leave previous room if any
    this.leaveRoom(socketId);

    const roomCode = this.generateRoomCode();
    const player: RoomPlayer = {
      id: 'xinyi',
      socketId,
      name: playerName || 'Xinyi',
      isReady: false,
      isConnected: true,
    };

    const room: RoomState = {
      roomCode,
      players: {
        xinyi: player,
        lumi: player,
      },
      status: 'waiting',
    };

    this.rooms.set(roomCode, room);
    this.socketToRoom.set(socketId, { roomCode, playerId: 'xinyi' });

    return { success: true, room, player };
  }

  public joinRoom(
    roomCode: string,
    socketId: string,
    playerName: string = 'James'
  ): {
    success: boolean;
    room?: RoomState;
    player?: RoomPlayer;
    error?: string;
  } {
    const formattedCode = roomCode.trim();
    const room = this.rooms.get(formattedCode);

    if (!room) {
      return { success: false, error: '房间不存在，请检查6位房间代码' };
    }

    const p1 = room.players.xinyi || room.players.lumi;
    const p2 = room.players.james || room.players.flare;

    // Check if re-connecting to existing slot
    if (p1 && !p1.isConnected) {
      // Xinyi reconnect
      p1.socketId = socketId;
      p1.isConnected = true;
      this.socketToRoom.set(socketId, { roomCode: formattedCode, playerId: 'xinyi' });
      return { success: true, room, player: p1 };
    }

    if (p2 && !p2.isConnected) {
      // James reconnect
      p2.socketId = socketId;
      p2.isConnected = true;
      this.socketToRoom.set(socketId, { roomCode: formattedCode, playerId: 'james' });
      return { success: true, room, player: p2 };
    }

    // Check if slot 2 is available
    if (p2 && p2.isConnected) {
      return { success: false, error: '房间人数已满（最多 2 人）' };
    }

    // Join as James (Player 2)
    const player: RoomPlayer = {
      id: 'james',
      socketId,
      name: playerName || 'James',
      isReady: false,
      isConnected: true,
    };

    room.players.james = player;
    room.players.flare = player;
    room.status = 'lobby';

    this.socketToRoom.set(socketId, { roomCode: formattedCode, playerId: 'james' });

    return { success: true, room, player };
  }

  public setPlayerReady(
    socketId: string,
    isReady: boolean,
    onCountdownTick: (roomCode: string, seconds: number) => void,
    onGameStart: (roomCode: string) => void
  ): { room?: RoomState; player?: RoomPlayer } {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return {};

    const room = this.rooms.get(mapping.roomCode);
    if (!room) return {};

    const player = room.players[mapping.playerId] || (mapping.playerId === 'xinyi' ? room.players.lumi : room.players.flare);
    if (!player) return {};

    player.isReady = isReady;

    const p1 = room.players.xinyi || room.players.lumi;
    const p2 = room.players.james || room.players.flare;
    const bothPresent = !!(p1 && p2);
    const bothReady = !!(p1?.isReady && p2?.isReady);

    // Cancel existing countdown if any
    this.clearCountdown(room.roomCode);

    if (bothPresent && bothReady) {
      room.status = 'countdown';
      this.startCountdown(room.roomCode, onCountdownTick, onGameStart);
    } else {
      if (room.status === 'countdown') {
        room.status = 'lobby';
        onCountdownTick(room.roomCode, -1); // -1 indicates countdown cancelled
      }
    }

    return { room, player };
  }

  private startCountdown(
    roomCode: string,
    onCountdownTick: (roomCode: string, seconds: number) => void,
    onGameStart: (roomCode: string) => void
  ) {
    const timers: NodeJS.Timeout[] = [];

    // 3 seconds -> 2 seconds -> 1 second -> START
    const steps = [
      { delay: 0, count: 3 },
      { delay: 1000, count: 2 },
      { delay: 2000, count: 1 },
      { delay: 3000, count: 0 }, // 0 = START
    ];

    steps.forEach(({ delay, count }) => {
      const t = setTimeout(() => {
        const room = this.rooms.get(roomCode);
        if (!room || room.status !== 'countdown') return;

        if (count > 0) {
          room.countdown = count;
          onCountdownTick(roomCode, count);
        } else {
          room.status = 'in_game';
          room.countdown = 0;
          onCountdownTick(roomCode, 0);
          onGameStart(roomCode);
        }
      }, delay);
      timers.push(t);
    });

    this.countdownTimers.set(roomCode, timers);
  }

  private clearCountdown(roomCode: string) {
    const timers = this.countdownTimers.get(roomCode);
    if (timers) {
      timers.forEach((t) => clearTimeout(t));
      this.countdownTimers.delete(roomCode);
    }
  }

  public setLevel(roomCode: string, levelId: number): RoomState | undefined {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.currentLevel = levelId;
      return room;
    }
    return undefined;
  }

  public handleDisconnect(socketId: string): {
    roomCode?: string;
    playerId?: PlayerId;
    room?: RoomState;
  } {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return {};

    const { roomCode, playerId } = mapping;
    const room = this.rooms.get(roomCode);

    this.socketToRoom.delete(socketId);

    if (!room) return { roomCode, playerId };

    const player = room.players[playerId];
    if (player) {
      player.isConnected = false;
      player.isReady = false;
    }

    // Cancel countdown if player disconnected
    this.clearCountdown(roomCode);
    if (room.status === 'countdown') {
      room.status = 'lobby';
    }

    // If both disconnected, schedule room cleanup
    const p1Online = (room.players.xinyi || room.players.lumi)?.isConnected;
    const p2Online = (room.players.james || room.players.flare)?.isConnected;

    if (!p1Online && !p2Online) {
      setTimeout(() => {
        const current = this.rooms.get(roomCode);
        if (
          current &&
          !(current.players.xinyi || current.players.lumi)?.isConnected &&
          !(current.players.james || current.players.flare)?.isConnected
        ) {
          this.rooms.delete(roomCode);
        }
      }, 60000); // 1 minute grace period for reloads
    }

    return { roomCode, playerId, room };
  }

  public leaveRoom(socketId: string): { roomCode?: string; playerId?: PlayerId; room?: RoomState } {
    const res = this.handleDisconnect(socketId);
    if (res.roomCode && res.room && res.playerId) {
      delete res.room.players[res.playerId];
      if (Object.keys(res.room.players).length === 0) {
        this.cleanupGate(res.roomCode);
        this.rooms.delete(res.roomCode);
      }
    }
    return res;
  }

  // Authoritative Server-side Gate State Machine
  public getOrCreateGate(roomCode: string): ServerGateState {
    let gate = this.roomGates.get(roomCode);
    if (!gate) {
      gate = {
        state: 'CLOSED',
        isOpen: false,
        openProgress: 0,
        isUnlocked: false,
        minOpenTimer: 0,
        releaseDelayTimer: 0,
        bluePressed: false,
        redPressed: false,
        lastTickTime: Date.now(),
      };
      this.roomGates.set(roomCode, gate);
    }
    return gate;
  }

  public updateButtonAndGate(
    roomCode: string,
    buttonId: string,
    isPressed: boolean,
    broadcastFn: (payload: GateSyncPayload) => void,
    triggerTarget?: 'gate' | 'platform' | 'bridge' | 'door' | 'trap',
    playerTarget?: string
  ): GateSyncPayload | null {
    // If the button explicitly triggers a platform, bridge, or trap, DO NOT modify gate!
    if (triggerTarget && triggerTarget !== 'gate') {
      return null;
    }

    // Explicitly reject known puzzle switches that are not gate buttons
    if (
      buttonId.includes('ferry') ||
      buttonId.includes('bridge') ||
      buttonId.includes('box') ||
      buttonId.includes('element') ||
      buttonId.includes('mirror') ||
      buttonId.includes('speed') ||
      buttonId.includes('lab') ||
      buttonId.includes('seq')
    ) {
      if (triggerTarget !== 'gate') return null;
    }

    const gate = this.getOrCreateGate(roomCode);

    // Only designated gate buttons affect the cooperative gate
    const isBlue =
      (triggerTarget === 'gate' && (playerTarget === 'xinyi' || playerTarget === 'lumi' || buttonId.includes('blue'))) ||
      buttonId === 'btn-blue' ||
      buttonId.startsWith('btn-blue-');

    const isRed =
      (triggerTarget === 'gate' && (playerTarget === 'james' || playerTarget === 'flare' || buttonId.includes('orange') || buttonId.includes('red'))) ||
      buttonId === 'btn-orange' ||
      buttonId.startsWith('btn-orange-') ||
      buttonId.startsWith('btn-red-');

    if (!isBlue && !isRed) {
      // Not a gate button
      return null;
    }

    if (isBlue) {
      gate.bluePressed = isPressed;
    } else if (isRed) {
      gate.redPressed = isPressed;
    }

    if (gate.bluePressed && gate.redPressed) {
      gate.isUnlocked = true;
    }

    const now = Date.now();
    const deltaMs = Math.min(100, Math.max(16, now - gate.lastTickTime));
    gate.lastTickTime = now;

    const result = updateGateLogic({
      gate: {
        id: 'coop-gate',
        x: 1105,
        y: 154,
        width: 24,
        height: 136,
        openProgress: gate.openProgress,
        isOpen: gate.isOpen,
        state: gate.state,
        isUnlocked: gate.isUnlocked,
        minOpenTimer: 0,
        releaseDelayTimer: 0,
        color: '#334155',
        accentColor: '#10b981',
      },
      bluePressed: gate.bluePressed,
      redPressed: gate.redPressed,
      deltaMs,
    });

    gate.isUnlocked = result.isUnlocked;
    gate.state = result.state;
    gate.isOpen = result.isOpen;
    gate.openProgress = result.openProgress;
    gate.minOpenTimer = 0;
    gate.releaseDelayTimer = 0;

    const payload: GateSyncPayload = {
      roomCode,
      state: gate.state,
      isOpen: gate.isOpen,
      openProgress: gate.openProgress,
      isUnlocked: gate.isUnlocked,
      minOpenTimer: 0,
      releaseDelayTimer: 0,
      bluePressed: gate.bluePressed,
      redPressed: gate.redPressed,
      timestamp: now,
    };

    broadcastFn(payload);

    // If gate is unlocking/opening, ensure server loop keeps broadcasting until fully open (1.0)
    if (gate.isUnlocked && gate.openProgress < 1.0) {
      this.ensureGateLoop(roomCode, broadcastFn);
    }

    return payload;
  }

  private ensureGateLoop(roomCode: string, broadcastFn: (payload: GateSyncPayload) => void) {
    const gate = this.roomGates.get(roomCode);
    if (!gate) return;

    if (gate.intervalTimer) return; // Loop is already running

    gate.intervalTimer = setInterval(() => {
      const g = this.roomGates.get(roomCode);
      if (!g) return;

      const now = Date.now();
      const deltaMs = Math.min(100, Math.max(16, now - g.lastTickTime));
      g.lastTickTime = now;

      const res = updateGateLogic({
        gate: {
          id: 'coop-gate',
          x: 1105,
          y: 154,
          width: 24,
          height: 136,
          openProgress: g.openProgress,
          isOpen: g.isOpen,
          state: g.state,
          isUnlocked: g.isUnlocked,
          minOpenTimer: 0,
          releaseDelayTimer: 0,
          color: '#334155',
          accentColor: '#10b981',
        },
        bluePressed: g.bluePressed,
        redPressed: g.redPressed,
        deltaMs,
      });

      g.isUnlocked = res.isUnlocked;
      g.state = res.state;
      g.isOpen = res.isOpen;
      g.openProgress = res.openProgress;
      g.minOpenTimer = 0;
      g.releaseDelayTimer = 0;

      broadcastFn({
        roomCode,
        state: g.state,
        isOpen: g.isOpen,
        openProgress: g.openProgress,
        isUnlocked: g.isUnlocked,
        minOpenTimer: 0,
        releaseDelayTimer: 0,
        bluePressed: g.bluePressed,
        redPressed: g.redPressed,
        timestamp: now,
      });

      // Check if gate has reached steady state: permanently OPEN (openProgress >= 1.0)
      const isSteadyOpen = g.isUnlocked && g.openProgress >= 1.0;
      const isSteadyClosed = !g.isUnlocked && g.state === 'CLOSED' && !g.bluePressed && !g.redPressed && g.openProgress <= 0.0;

      if (isSteadyOpen || isSteadyClosed) {
        clearInterval(g.intervalTimer);
        g.intervalTimer = undefined;
      }
    }, 45); // ~22 updates/second during transitions
  }

  public resetGate(roomCode: string, broadcastFn?: (payload: GateSyncPayload) => void): GateSyncPayload {
    const gate = this.roomGates.get(roomCode);
    if (gate && gate.intervalTimer) {
      clearInterval(gate.intervalTimer);
      gate.intervalTimer = undefined;
    }

    const newGate: ServerGateState = {
      state: 'CLOSED',
      isOpen: false,
      openProgress: 0,
      isUnlocked: false,
      minOpenTimer: 0,
      releaseDelayTimer: 0,
      bluePressed: false,
      redPressed: false,
      lastTickTime: Date.now(),
    };
    this.roomGates.set(roomCode, newGate);

    const payload: GateSyncPayload = {
      roomCode,
      state: 'CLOSED',
      isOpen: false,
      openProgress: 0,
      isUnlocked: false,
      minOpenTimer: 0,
      releaseDelayTimer: 0,
      bluePressed: false,
      redPressed: false,
      timestamp: Date.now(),
    };

    if (broadcastFn) {
      broadcastFn(payload);
    }
    return payload;
  }

  public cleanupGate(roomCode: string) {
    const gate = this.roomGates.get(roomCode);
    if (gate && gate.intervalTimer) {
      clearInterval(gate.intervalTimer);
    }
    this.roomGates.delete(roomCode);
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }

  public getRoomsSummary(): Array<{ roomCode: string; levelId: number; playerCount: number; status: string }> {
    const summary: Array<{ roomCode: string; levelId: number; playerCount: number; status: string }> = [];
    for (const [code, room] of this.rooms.entries()) {
      let playerCount = 0;
      if (room.players.xinyi?.isConnected || room.players.lumi?.isConnected) playerCount++;
      if (room.players.james?.isConnected || room.players.flare?.isConnected) playerCount++;
      summary.push({
        roomCode: code,
        levelId: room.currentLevel || 1,
        playerCount,
        status: room.status || 'waiting',
      });
    }
    return summary;
  }
}
