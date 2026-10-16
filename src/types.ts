export type PlayerId = 'xinyi' | 'james';
export type AnyPlayerId = PlayerId | 'lumi' | 'flare';

export type AnimationState = 'idle' | 'run' | 'jump' | 'fall' | 'hurt';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  color: string;
  secondaryColor: string;
  accentColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  jumpCount: number;
  health: number;
  maxHealth: number;
  isInExit: boolean;
  scaleX: number;
  scaleY: number;
  walkFrame: number;
  animationState: AnimationState;
  animationTimer: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  topColor?: string;
  type?: 'ground' | 'platform' | 'pillar';
}

export interface MovingPlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  speed: number;
  progress: number; // 0 to 1
  direction: 1 | -1;
  requiresSwitchId?: string | string[]; // If set, only moves when switch is pressed
  isSwitchActivated?: boolean;
  stayActive?: boolean;
  isUnlocked?: boolean;
  pauseTimer?: number;
  color?: string;
  topColor?: string;
}

export interface PushableBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  color: string;
  accentColor?: string;
  borderColor?: string;
  pushableBy?: AnyPlayerId | 'both';
  label?: string;
  spawnX?: number;
  spawnY?: number;
  weight?: number;
  element?: 'fire' | 'water' | 'normal';
}

export interface ConveyorBelt {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number; // positive = push right, negative = push left
  isActive: boolean;
  requiresSwitchId?: string;
  color?: string;
  topColor?: string;
  beltDirection?: 'LEFT' | 'RIGHT';
}

export interface TalkingTerminal {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  p1Detected?: boolean;
  p2Detected?: boolean;
  isActivated?: boolean;
  message?: string;
}

export interface Gem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isCollected: boolean;
  color?: string;
  glowColor?: string;
  type?: 'blue' | 'orange' | 'general';
}

export type HazardType = 'water' | 'fire' | 'spikes' | 'pit';

export interface HazardZone {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  // Water: Xinyi safe, James hurt. Fire: James safe, Xinyi hurt. Spikes/Pit: both hurt.
  safeFor?: AnyPlayerId;
  label?: string;
}

export interface Bridge {
  id: string;
  x: number;
  y: number;
  width: number; // Current extended width
  targetWidth: number; // Fully extended width
  height: number;
  openProgress: number; // 0 (closed/retracted) to 1 (fully open)
  state: 'CLOSED' | 'EXTENDING' | 'OPEN';
  requiredSwitchIds: string[]; // Switch IDs required to trigger
  color?: string;
  topColor?: string;
  stayOpen?: boolean;
  isUnlocked?: boolean;
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isActive: boolean;
  respawnP1: Vector2D;
  respawnP2: Vector2D;
  label?: string;
}

export interface Teleporter {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
  color: string;
  glowColor?: string;
  label?: string;
  assignedPlayer?: AnyPlayerId; // If set, only this player can use
  cooldownP1?: number;
  cooldownP2?: number;
}

export interface FallingPlatform {
  id: string;
  x: number;
  y: number;
  initialY: number;
  width: number;
  height: number;
  state: 'idle' | 'shaking' | 'falling' | 'respawning';
  timer: number;
  color?: string;
  topColor?: string;
}

export interface FloorButton {
  id: string;
  playerTarget?: AnyPlayerId | 'any';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isPressed: boolean;
  pressProgress: number; // 0 to 1
  color: string;
  glowColor: string;
  triggerTarget?: 'gate' | 'platform' | 'bridge' | 'door' | 'trap';
  targetId?: string;
  isFake?: boolean;
  countdownTimer?: number;
  pairButtonId?: string;
  requiredBoxId?: string;
  weightPlate?: boolean;
  mountedPlatformId?: string;
}

export type GateState = 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING';

export interface CoopGate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  openProgress: number; // 0 = closed, 1 = fully open
  isOpen: boolean;
  state: GateState;
  isUnlocked?: boolean; // Permanent cooperative unlock flag
  minOpenTimer: number; // In milliseconds, minimum duration gate stays open
  releaseDelayTimer: number; // In milliseconds, grace period before closing
  color: string;
  accentColor: string;
  requiresGateSwitchIds?: string[];
  requiredCount?: number;
}

export interface ExitZone {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
  opacity: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'star' | 'square';
}

export interface LaserHazard {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colorType: 'red' | 'blue'; // 'red' safe for James, fatal for Xinyi; 'blue' safe for Xinyi, fatal for James
  orientation?: 'vertical' | 'horizontal';
  isActive: boolean;
  cycle?: {
    onDurationMs: number;
    offDurationMs: number;
    offsetMs?: number;
  };
  switchId?: string; // Toggled or disabled by button/switch
  label?: string;
  moving?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    speed: number;
    pauseTimer?: number;
    progress?: number;
    direction?: number;
  };
}

export interface LaserMirror {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: 45 | 135;
  rotatorButtonId?: string;
  label?: string;
}

export interface LaserReceiver {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  requiredColor: 'red' | 'blue';
  isHit: boolean;
  charge: number; // 0 to 100
  label?: string;
}

export interface LaserDirectionController {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  laserId: string;
  direction: 'right' | 'down' | 'left' | 'up';
  buttonId: string;
  initialDirection: 'right' | 'down' | 'left' | 'up';
  label?: string;
}

export interface GhostPlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean; // only solid and visible during time freeze
  color?: string;
  topColor?: string;
  label?: string;
}

export interface PortalLink {
  id: string;
  fromPortalId: string;
  toPortalId: string;
  isActive: boolean;
  color?: string;
}

export interface PortalDirectionSwitch {
  id: string;
  buttonId: string;
  portalId: string;
  targetA: string;
  targetB: string;
  currentTarget: string;
  label?: string;
}

export interface TeleportAnchor {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isActivated: boolean;
  label?: string;
}

export interface VanishingPlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  state: 'safe' | 'warning' | 'disappearing' | 'invisible' | 'returning' | 'safe_locked';
  timer: number; // Current state timer
  warningDuration?: number; // e.g. 150 frames (~2.5s)
  invisibleDuration?: number; // e.g. 240 frames (~4.0s)
  triggerOnStep?: boolean;
  color?: string;
  topColor?: string;
  label?: string;
  group?: 'red' | 'blue' | 'neutral';
}

export interface WorldPlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  world: 'A' | 'B' | 'both';
  color?: string;
  topColor?: string;
  label?: string;
  isActive?: boolean;
}

export interface WorldSwitch {
  id: string;
  buttonId: string;
  targetWorld: 'A' | 'B' | 'toggle';
  label?: string;
}

export interface GameLevel {
  id: number;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  spawnP1: Vector2D;
  spawnP2: Vector2D;
  platforms: Platform[];
  buttons: FloorButton[];
  gate: CoopGate;
  exit: ExitZone;
  clouds: Cloud[];
  gems?: Gem[];
  movingPlatforms?: MovingPlatform[];
  boxes?: PushableBox[];
  hazards?: HazardZone[];
  bridges?: Bridge[];
  checkpoints?: Checkpoint[];
  teleporters?: Teleporter[];
  fallingPlatforms?: FallingPlatform[];
  lasers?: LaserHazard[];
  vanishingPlatforms?: VanishingPlatform[];
  conveyorBelts?: ConveyorBelt[];
  talkingTerminals?: TalkingTerminal[];
  laserMirrors?: LaserMirror[];
  laserReceivers?: LaserReceiver[];
  laserControllers?: LaserDirectionController[];
  ghostPlatforms?: GhostPlatform[];
  portalLinks?: PortalLink[];
  portalSwitches?: PortalDirectionSwitch[];
  teleportAnchors?: TeleportAnchor[];
  worldPlatforms?: WorldPlatform[];
  worldSwitches?: WorldSwitch[];
  puzzleSequence?: {
    switchIds: string[]; // e.g. ['btn-seq-1', 'btn-seq-2', 'btn-seq-3', 'btn-seq-4']
    currentIndex: number;
    isSolved: boolean;
  };
  parTimeSeconds?: number;
  theme?: 'sky' | 'temple' | 'industrial' | 'elemental' | 'dungeon';
}

export type GameStatus = 'menu' | 'playing' | 'completed';

export type GameMode = 'local' | 'online';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface RoomPlayer {
  id: PlayerId;
  socketId: string;
  name: string;
  isReady: boolean;
  isConnected: boolean;
}

export interface RoomState {
  roomCode: string;
  players: Partial<Record<AnyPlayerId, RoomPlayer>> & {
    xinyi?: RoomPlayer;
    james?: RoomPlayer;
    lumi?: RoomPlayer;
    flare?: RoomPlayer;
  };
  status: 'waiting' | 'lobby' | 'countdown' | 'in_game';
  countdown?: number;
  currentLevel?: number;
}

export interface PlayerSyncPayload {
  roomCode: string;
  playerId: AnyPlayerId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  jumpCount: number;
  health: number;
  isInExit: boolean;
  scaleX: number;
  scaleY: number;
  walkFrame: number;
  animationState: AnimationState;
}

export interface ButtonSyncPayload {
  roomCode: string;
  buttonId: string;
  isPressed: boolean;
  pressProgress: number;
  triggerTarget?: 'gate' | 'platform' | 'bridge' | 'door' | 'trap';
  playerTarget?: string;
}

export interface GateSyncPayload {
  roomCode: string;
  state: GateState;
  isOpen: boolean;
  openProgress: number;
  isUnlocked?: boolean;
  minOpenTimer: number;
  releaseDelayTimer: number;
  bluePressed: boolean;
  redPressed: boolean;
  timestamp?: number;
}

export interface WorldSyncPayload {
  roomCode: string;
  levelId: number;
  timestamp: number;
  movingPlatforms?: Array<{
    id: string;
    x: number;
    y: number;
    progress: number;
    direction: 1 | -1;
    isUnlocked?: boolean;
    pauseTimer?: number;
  }>;
  bridges?: Array<{
    id: string;
    width: number;
    openProgress: number;
    state: 'CLOSED' | 'EXTENDING' | 'OPEN';
    isUnlocked?: boolean;
  }>;
  boxes?: Array<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    isGrounded: boolean;
  }>;
  buttons?: Array<{
    id: string;
    isPressed: boolean;
    pressProgress: number;
  }>;
  gate?: {
    isOpen: boolean;
    openProgress: number;
    state: GateState;
    isUnlocked: boolean;
  };
  gems?: Array<{
    id: string;
    isCollected: boolean;
  }>;
  vanishingPlatforms?: Array<{
    id: string;
    state: 'safe' | 'warning' | 'disappearing' | 'invisible' | 'returning' | 'safe_locked';
    timer: number;
  }>;
  worldPlatforms?: Array<{
    id: string;
    isActive?: boolean;
  }>;
  currentWorld?: 'A' | 'B';
  lives: number;
  gemsCollected: number;
  activeCheckpointId?: string | null;
}

export interface DeathSyncPayload {
  roomCode: string;
  playerId: AnyPlayerId;
  remainingLives: number;
  respawnP1: { x: number; y: number };
  respawnP2: { x: number; y: number };
  checkpointId?: string | null;
}

export interface GemSyncPayload {
  roomCode: string;
  gemId: string;
  playerId: AnyPlayerId;
  totalCollected: number;
}

export interface CheckpointSyncPayload {
  roomCode: string;
  checkpointId: string;
  playerId?: AnyPlayerId;
}

export interface BoxSyncPayload {
  roomCode: string;
  boxes: Array<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
  }>;
}

export interface BridgeSyncPayload {
  roomCode: string;
  bridgeId: string;
  state: 'CLOSED' | 'EXTENDING' | 'OPEN';
  openProgress: number;
}

export interface LevelScore {
  timeSeconds: number;
  deaths: number;
  checkpointsUsed: number;
  stars: 1 | 2 | 3;
  speedBonusText?: 'PERFECT!' | 'FAST CLEAR!' | 'GOOD!';
}

export interface LevelMeta {
  id: number;
  title: string;
  name: string;
  desc: string;
  difficulty: string;
  stars?: number;
  unlocked: boolean;
}


