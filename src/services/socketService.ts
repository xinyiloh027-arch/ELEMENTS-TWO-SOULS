import { io, Socket } from 'socket.io-client';
import {
  ButtonSyncPayload,
  CheckpointSyncPayload,
  ConnectionStatus,
  DeathSyncPayload,
  GateSyncPayload,
  GemSyncPayload,
  PlayerId,
  PlayerSyncPayload,
  RoomPlayer,
  RoomState,
  WorldSyncPayload,
} from '../types';

type Listener<T> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private pingMs: number = 0;
  private pingIntervalId: any = null;

  // Listeners
  private statusListeners: Set<Listener<ConnectionStatus>> = new Set();
  private pingListeners: Set<Listener<number>> = new Set();
  private roomListeners: Set<Listener<RoomState>> = new Set();
  private countdownListeners: Set<Listener<number>> = new Set();
  private gameStartListeners: Set<() => void> = new Set();
  private playerSyncListeners: Set<Listener<PlayerSyncPayload>> = new Set();
  private worldSyncListeners: Set<Listener<WorldSyncPayload>> = new Set();
  private deathSyncListeners: Set<Listener<DeathSyncPayload>> = new Set();
  private gemSyncListeners: Set<Listener<GemSyncPayload>> = new Set();
  private checkpointSyncListeners: Set<Listener<CheckpointSyncPayload>> = new Set();
  private buttonSyncListeners: Set<Listener<ButtonSyncPayload>> = new Set();
  private gateSyncListeners: Set<Listener<GateSyncPayload>> = new Set();
  private restartListeners: Set<() => void> = new Set();
  private levelCompleteListeners: Set<() => void> = new Set();
  private changeLevelListeners: Set<Listener<{ levelId: number }>> = new Set();
  private teammateDisconnectListeners: Set<Listener<{ playerId?: PlayerId; message?: string }>> = new Set();

  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public getPing(): number {
    return this.pingMs;
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  public connect(): void {
    if (this.socket && this.socket.connected) return;

    this.setStatus('connecting');

    // Connect to same origin / port 3000
    this.socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 800,
      reconnectionDelayMax: 3000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.setStatus('connected');
      this.startPingLoop();
    });

    this.socket.on('connect_error', () => {
      this.setStatus('reconnecting');
    });

    this.socket.on('reconnect_attempt', () => {
      this.setStatus('reconnecting');
    });

    this.socket.on('reconnect', () => {
      this.setStatus('connected');
      this.startPingLoop();
    });

    this.socket.on('disconnect', (reason) => {
      this.stopPingLoop();
      if (reason === 'io client disconnect') {
        this.setStatus('disconnected');
      } else {
        this.setStatus('reconnecting');
      }
    });

    // Room events
    this.socket.on('room_state_update', (room: RoomState) => {
      this.roomListeners.forEach((fn) => fn(room));
    });

    this.socket.on('countdown_tick', (data: { seconds: number }) => {
      this.countdownListeners.forEach((fn) => fn(data.seconds));
    });

    this.socket.on('game_start', () => {
      this.gameStartListeners.forEach((fn) => fn());
    });

    // In-game synchronization
    this.socket.on('remote_player_sync', (payload: PlayerSyncPayload) => {
      this.playerSyncListeners.forEach((fn) => fn(payload));
    });

    this.socket.on('remote_world_sync', (payload: WorldSyncPayload) => {
      this.worldSyncListeners.forEach((fn) => fn(payload));
    });

    this.socket.on('remote_death_sync', (payload: DeathSyncPayload) => {
      this.deathSyncListeners.forEach((fn) => fn(payload));
    });

    this.socket.on('remote_gem_sync', (payload: GemSyncPayload) => {
      this.gemSyncListeners.forEach((fn) => fn(payload));
    });

    this.socket.on('remote_checkpoint_sync', (payload: CheckpointSyncPayload) => {
      this.checkpointSyncListeners.forEach((fn) => fn(payload));
    });

    this.socket.on('remote_button_sync', (payload: ButtonSyncPayload) => {
      this.buttonSyncListeners.forEach((fn) => fn(payload));
    });

    this.socket.on('remote_gate_sync', (payload: GateSyncPayload) => {
      this.gateSyncListeners.forEach((fn) => fn(payload));
    });

    this.socket.on('remote_restart_level', () => {
      this.restartListeners.forEach((fn) => fn());
    });

    this.socket.on('remote_level_complete', () => {
      this.levelCompleteListeners.forEach((fn) => fn());
    });

    this.socket.on('remote_change_level', (data: { levelId: number }) => {
      this.changeLevelListeners.forEach((fn) => fn(data));
    });

    this.socket.on('teammate_disconnected', (data: { playerId?: PlayerId; message?: string }) => {
      this.teammateDisconnectListeners.forEach((fn) => fn(data));
    });
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingIntervalId = setInterval(() => {
      if (!this.socket || !this.socket.connected) return;
      const start = performance.now();
      this.socket.emit('client_ping', start, () => {
        const rtt = Math.round(performance.now() - start);
        this.pingMs = rtt;
        this.pingListeners.forEach((fn) => fn(rtt));
      });
    }, 2000);
  }

  private stopPingLoop() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private setStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  public subscribeStatus(fn: Listener<ConnectionStatus>): () => void {
    this.statusListeners.add(fn);
    fn(this.connectionStatus);
    return () => this.statusListeners.delete(fn);
  }

  public subscribePing(fn: Listener<number>): () => void {
    this.pingListeners.add(fn);
    fn(this.pingMs);
    return () => this.pingListeners.delete(fn);
  }

  public subscribeRoom(fn: Listener<RoomState>): () => void {
    this.roomListeners.add(fn);
    return () => this.roomListeners.delete(fn);
  }

  public subscribeCountdown(fn: Listener<number>): () => void {
    this.countdownListeners.add(fn);
    return () => this.countdownListeners.delete(fn);
  }

  public subscribeGameStart(fn: () => void): () => void {
    this.gameStartListeners.add(fn);
    return () => this.gameStartListeners.delete(fn);
  }

  public subscribePlayerSync(fn: Listener<PlayerSyncPayload>): () => void {
    this.playerSyncListeners.add(fn);
    return () => this.playerSyncListeners.delete(fn);
  }

  public subscribeWorldSync(fn: Listener<WorldSyncPayload>): () => void {
    this.worldSyncListeners.add(fn);
    return () => this.worldSyncListeners.delete(fn);
  }

  public subscribeDeathSync(fn: Listener<DeathSyncPayload>): () => void {
    this.deathSyncListeners.add(fn);
    return () => this.deathSyncListeners.delete(fn);
  }

  public subscribeGemSync(fn: Listener<GemSyncPayload>): () => void {
    this.gemSyncListeners.add(fn);
    return () => this.gemSyncListeners.delete(fn);
  }

  public subscribeCheckpointSync(fn: Listener<CheckpointSyncPayload>): () => void {
    this.checkpointSyncListeners.add(fn);
    return () => this.checkpointSyncListeners.delete(fn);
  }

  public subscribeButtonSync(fn: Listener<ButtonSyncPayload>): () => void {
    this.buttonSyncListeners.add(fn);
    return () => this.buttonSyncListeners.delete(fn);
  }

  public subscribeGateSync(fn: Listener<GateSyncPayload>): () => void {
    this.gateSyncListeners.add(fn);
    return () => this.gateSyncListeners.delete(fn);
  }

  public subscribeRestart(fn: () => void): () => void {
    this.restartListeners.add(fn);
    return () => this.restartListeners.delete(fn);
  }

  public subscribeLevelComplete(fn: () => void): () => void {
    this.levelCompleteListeners.add(fn);
    return () => this.levelCompleteListeners.delete(fn);
  }

  public subscribeChangeLevel(fn: Listener<{ levelId: number }>): () => void {
    this.changeLevelListeners.add(fn);
    return () => this.changeLevelListeners.delete(fn);
  }

  public subscribeTeammateDisconnect(fn: Listener<{ playerId?: PlayerId; message?: string }>): () => void {
    this.teammateDisconnectListeners.add(fn);
    return () => this.teammateDisconnectListeners.delete(fn);
  }

  // Client actions
  public async createRoom(playerName: string = 'Xinyi'): Promise<{
    success: boolean;
    roomCode?: string;
    player?: RoomPlayer;
    room?: RoomState;
    error?: string;
  }> {
    this.connect();
    return new Promise((resolve) => {
      if (!this.socket) {
        return resolve({ success: false, error: 'Socket 初始化失败' });
      }
      this.socket.emit('create_room', { playerName }, (res: any) => {
        resolve(res);
      });
    });
  }

  public async joinRoom(roomCode: string, playerName: string = 'James'): Promise<{
    success: boolean;
    roomCode?: string;
    player?: RoomPlayer;
    room?: RoomState;
    error?: string;
  }> {
    this.connect();
    return new Promise((resolve) => {
      if (!this.socket) {
        return resolve({ success: false, error: 'Socket 初始化失败' });
      }
      this.socket.emit('join_room', { roomCode, playerName }, (res: any) => {
        resolve(res);
      });
    });
  }

  public async setReady(isReady: boolean): Promise<{ success: boolean; isReady?: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        return resolve({ success: false, error: '未连接服务器' });
      }
      this.socket.emit('set_ready', { isReady }, (res: any) => {
        resolve(res);
      });
    });
  }

  public sendPlayerSync(payload: PlayerSyncPayload): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('sync_player', payload);
  }

  public sendWorldSync(payload: WorldSyncPayload): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('sync_world', payload);
  }

  public sendDeathSync(payload: DeathSyncPayload): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('sync_death', payload);
  }

  public sendGemSync(payload: GemSyncPayload): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('sync_gem', payload);
  }

  public sendCheckpointSync(payload: CheckpointSyncPayload): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('sync_checkpoint', payload);
  }

  public sendButtonSync(payload: ButtonSyncPayload): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('sync_button', payload);
  }

  public sendGateSync(payload: GateSyncPayload): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('sync_gate', payload);
  }

  public sendRestartLevel(roomCode: string): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('restart_level', { roomCode });
  }

  public sendLevelComplete(roomCode: string): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('level_complete', { roomCode });
  }

  public sendChangeLevel(roomCode: string, levelId: number): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('change_level', { roomCode, levelId });
  }

  public leaveRoom(): void {
    this.stopPingLoop();
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_room');
    }
  }

  public disconnect(): void {
    this.stopPingLoop();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
