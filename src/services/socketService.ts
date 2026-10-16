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

/**
 * Normalizes a raw URL string:
 * - Trims whitespace
 * - Ensures https:// (or http:// for localhost)
 * - Removes trailing slash
 * - Upgrades to https:// if running on an HTTPS page to prevent mixed-content blocks
 */
export function normalizeServerUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url) return '';

  if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }

  // If the browser page is HTTPS, enforce https:// for the socket server
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://') &&
    !url.includes('localhost') &&
    !url.includes('127.0.0.1')
  ) {
    url = url.replace(/^http:\/\//i, 'https://');
  }

  return url.replace(/\/+$/, '');
}

export const PRODUCTION_SOCKET_URL = 'https://elements-two-souls.onrender.com';

/**
 * Resolves the default socket server URL:
 * 1. User manual override stored in localStorage (validated)
 * 2. Vite environment variable VITE_SOCKET_URL (injected during build)
 * 3. Localhost fallback when running locally in development mode
 * 4. Production Render server fallback (https://elements-two-souls.onrender.com)
 */
export function getDefaultServerUrl(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored =
        localStorage.getItem('duality_socket_url') ||
        localStorage.getItem('twinquest_socket_url');
      if (stored && stored.trim()) {
        const normalized = normalizeServerUrl(stored);
        const isRemoteHost =
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1';
        // Ignore stored localhost entries if running on a remote domain like GitHub Pages
        if (!(isRemoteHost && (normalized.includes('localhost') || normalized.includes('127.0.0.1')))) {
          return normalized;
        }
      }
    } catch {
      // Ignore localStorage access issues
    }
  }

  const envUrl = (import.meta as any).env?.VITE_SOCKET_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return normalizeServerUrl(envUrl);
  }

  // Local development fallback only when on localhost/127.0.0.1 in dev mode
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (isLocalhost && (import.meta as any).env?.DEV) {
      return window.location.port === '3000'
        ? window.location.origin
        : 'http://localhost:3000';
    }
  }

  // Default production fallback to your Render server
  return PRODUCTION_SOCKET_URL;
}

class SocketService {
  private socket: Socket | null = null;
  private currentConnectedUrl: string = '';
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
  private teammateDisconnectListeners: Set<
    Listener<{ playerId?: PlayerId; message?: string }>
  > = new Set();

  public getServerUrl(): string {
    return getDefaultServerUrl();
  }

  public setServerUrl(newUrl: string): void {
    const normalized = normalizeServerUrl(newUrl);
    if (typeof window !== 'undefined') {
      try {
        if (normalized) {
          localStorage.setItem('duality_socket_url', normalized);
        } else {
          localStorage.removeItem('duality_socket_url');
        }
      } catch {
        // Ignore storage error
      }
    }
    // Reconnect to the new URL immediately
    this.disconnect();
    this.connect();
  }

  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public getPing(): number {
    return this.pingMs;
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  public connect(customUrl?: string): void {
    const targetUrl = customUrl ? normalizeServerUrl(customUrl) : this.getServerUrl();

    if (!targetUrl) {
      this.setStatus('unconfigured');
      return;
    }

    // If socket exists and is already connected or connecting to the exact same URL, do nothing
    if (this.socket && this.currentConnectedUrl === targetUrl) {
      if (this.socket.connected) {
        this.setStatus('connected');
        return;
      }
      if (this.connectionStatus === 'connecting') {
        return;
      }
    }

    // Clean up any previous socket instance
    this.disconnect();

    this.currentConnectedUrl = targetUrl;
    this.setStatus('connecting');

    // Connect with WebSocket prioritized and polling fallback for cloud hosting (Render)
    this.socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: true,
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

    this.socket.on(
      'teammate_disconnected',
      (data: { playerId?: PlayerId; message?: string }) => {
        this.teammateDisconnectListeners.forEach((fn) => fn(data));
      }
    );
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

  public subscribeTeammateDisconnect(
    fn: Listener<{ playerId?: PlayerId; message?: string }>
  ): () => void {
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
    if (!this.getServerUrl()) {
      return {
        success: false,
        error:
          '尚未配置 Render 联机服务器地址。请在下方输入您的后端服务公网 URL (如 https://xxxx.onrender.com)。',
      };
    }

    this.connect();

    return new Promise((resolve) => {
      if (!this.socket) {
        return resolve({ success: false, error: 'Socket 初始化失败' });
      }

      const timer = setTimeout(() => {
        resolve({
          success: false,
          error:
            '连接服务器超时。Render 免费实例初次启动需约 30-50 秒（冷启动），请稍候重试。',
        });
      }, 9000);

      this.socket.emit('create_room', { playerName }, (res: any) => {
        clearTimeout(timer);
        resolve(res);
      });
    });
  }

  public async joinRoom(
    roomCode: string,
    playerName: string = 'James'
  ): Promise<{
    success: boolean;
    roomCode?: string;
    player?: RoomPlayer;
    room?: RoomState;
    error?: string;
  }> {
    if (!this.getServerUrl()) {
      return {
        success: false,
        error:
          '尚未配置 Render 联机服务器地址。请在下方输入您的后端服务公网 URL (如 https://xxxx.onrender.com)。',
      };
    }

    this.connect();

    return new Promise((resolve) => {
      if (!this.socket) {
        return resolve({ success: false, error: 'Socket 初始化失败' });
      }

      const timer = setTimeout(() => {
        resolve({
          success: false,
          error:
            '连接服务器超时。Render 免费实例初次启动需约 30-50 秒（冷启动），请稍候重试。',
        });
      }, 9000);

      this.socket.emit('join_room', { roomCode, playerName }, (res: any) => {
        clearTimeout(timer);
        resolve(res);
      });
    });
  }

  public async setReady(
    isReady: boolean
  ): Promise<{ success: boolean; isReady?: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
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
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentConnectedUrl = '';
    this.setStatus('disconnected');
  }
}

export const socketService = new SocketService();
