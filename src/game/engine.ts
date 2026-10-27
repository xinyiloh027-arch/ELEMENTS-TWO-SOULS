import { getLevelById, getNextLevelId, LEVEL_01 } from './levels';
import { checkAABB, updateBoxesPhysics, updatePlayerPhysics } from './physics';
import { GameRenderer } from './renderer';
import { updateGateLogic } from './gateLogic';
import { soundManager } from '../services/soundManager';
import {
  ButtonSyncPayload,
  Checkpoint,
  CheckpointSyncPayload,
  DeathSyncPayload,
  GameLevel,
  GameMode,
  GateState,
  GateSyncPayload,
  GemSyncPayload,
  Particle,
  PlayerId,
  PlayerInput,
  PlayerState,
  PlayerSyncPayload,
  WorldSyncPayload,
} from '../types';
import { getCurrentTranslations, getCurrentLanguage } from '../i18n/LanguageContext';

export interface GameEngineCallbacks {
  onStateUpdate?: (state: {
    xinyi: PlayerState;
    james: PlayerState;
    lumi: PlayerState;
    flare: PlayerState;
    isLevelComplete: boolean;
    currentLevelId: number;
    gateState?: GateState;
    gateOpenProgress?: number;
    lives?: number;
    isGameOver?: boolean;
    gemsCollected?: number;
    totalGems?: number;
  }) => void;
  onLevelComplete?: (levelId: number) => void;
  onGameOver?: () => void;
  onLocalPlayerSync?: (payload: PlayerSyncPayload) => void;
  onLocalWorldSync?: (payload: WorldSyncPayload) => void;
  onLocalPlayerDeath?: (payload: DeathSyncPayload) => void;
  onLocalGemCollected?: (payload: GemSyncPayload) => void;
  onLocalCheckpointActivated?: (payload: CheckpointSyncPayload) => void;
  onLocalButtonSync?: (payload: ButtonSyncPayload) => void;
  onLocalGateSync?: (payload: GateSyncPayload) => void;
  onLocalLevelComplete?: (levelId: number) => void;
  onLevelChanged?: (levelId: number) => void;
}

export interface GameEngineOptions {
  mode?: GameMode;
  onlineRole?: PlayerId | 'lumi' | 'flare';
  roomCode?: string;
  initialLevelId?: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  private level: GameLevel;
  private players: Record<PlayerId, PlayerState>;
  private inputs: Record<PlayerId, PlayerInput>;
  private particles: Particle[] = [];
  private particleIdCounter: number = 0;
  private isLevelComplete: boolean = false;
  private isGameOver: boolean = false;
  private lives: number = 3;
  private gemsCollected: number = 0;
  private totalGems: number = 0;
  private gameTime: number = 0;
  private lastTimestamp: number = 0;
  private activeCheckpoint: Checkpoint | null = null;
  private cameraX: number = 0;
  private checkpointBanner: { text: string; timer: number } | null = null;
  private deathBanner: { title: string; subtitle: string; timer: number } | null = null;
  private distanceWarning: boolean = false;
  private dialoguePrompt: {
    xinyiText?: string;
    jamesText?: string;
    systemBanner?: string;
    countdown?: number;
  } | null = null;
  private dialogueTimer: number = 0;
  private l11RescueWaitTimer: number = 0;
  private l11FinalCountdown: number = 0;
  private l11FinalLaunched: boolean = false;
  private l11BoosterCharged: boolean = false;
  private l11SyncTimer: number = 0;
  private l11ReturnLocked: boolean = false;
  private l12RunTimer: number = 0;
  private l12FinalTimer: number = 0;
  private proximitySparkleCooldown: number = 0;
  private isTimeFrozen: boolean = false;
  private l15TimedSprintTimer: number = 0;
  private l16SwapCooldown: number = 0;
  private currentWorld: 'A' | 'B' = 'A';
  private l18WorldToggleCooldown: number = 0;

  private callbacks: GameEngineCallbacks;
  private mode: GameMode = 'local';
  private onlineRole: PlayerId = 'xinyi';
  private roomCode: string = '';

  private lastSyncTime: number = 0;
  private lastWorldSyncTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: GameEngineCallbacks = {},
    options: GameEngineOptions = {}
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = ctx;
    this.renderer = new GameRenderer(ctx);
    this.callbacks = callbacks;
    this.mode = options.mode || 'local';
    const rawRole = options.onlineRole;
    this.onlineRole = (rawRole === 'flare' ? 'james' : rawRole === 'lumi' ? 'xinyi' : rawRole) || 'xinyi';
    this.roomCode = options.roomCode || '';

    const initialId = options.initialLevelId || 1;
    const loadedLevel = getLevelById(initialId) || LEVEL_01;
    // Deep clone level state so mutations and resets work cleanly
    this.level = JSON.parse(JSON.stringify(loadedLevel));
    this.totalGems = this.level.gems ? this.level.gems.length : 0;
    this.gemsCollected = 0;
    this.lives = 3;
    this.isGameOver = false;

    this.inputs = {
      xinyi: { left: false, right: false, jump: false },
      james: { left: false, right: false, jump: false },
    };

    this.players = this.createInitialPlayers();
  }

  public getCurrentLevel(): GameLevel {
    return this.level;
  }

  public loadLevel(levelId: number) {
    const nextLevel = getLevelById(levelId);
    if (!nextLevel) return;

    this.level = JSON.parse(JSON.stringify(nextLevel));
    this.activeCheckpoint = null;
    this.cameraX = 0;
    this.checkpointBanner = null;
    this.deathBanner = null;
    this.distanceWarning = false;
    this.players = this.createInitialPlayers();
    this.inputs = {
      xinyi: { left: false, right: false, jump: false },
      james: { left: false, right: false, jump: false },
    };
    this.particles = [];
    this.isLevelComplete = false;
    this.isGameOver = false;
    this.lives = 3;
    this.gemsCollected = 0;
    this.totalGems = this.level.gems ? this.level.gems.length : 0;
    this.isTimeFrozen = false;
    this.l11RescueWaitTimer = 0;
    this.l11FinalCountdown = 0;
    this.l11FinalLaunched = false;
    this.l11BoosterCharged = false;
    this.l11SyncTimer = 0;
    this.l11ReturnLocked = false;
    this.l15TimedSprintTimer = 0;
    this.l16SwapCooldown = 0;
    this.currentWorld = 'A';
    this.l18WorldToggleCooldown = 0;

    if (this.callbacks.onLevelChanged) {
      this.callbacks.onLevelChanged(this.level.id);
    }
    this.notifyState();
  }

  private createInitialPlayers(): Record<PlayerId, PlayerState> {
    const spawnP1 = this.activeCheckpoint?.respawnP1 || this.level.spawnP1;
    const spawnP2 = this.activeCheckpoint?.respawnP2 || this.level.spawnP2;

    return {
      xinyi: {
        id: 'xinyi',
        name: 'Xinyi',
        color: '#0284c7', // Primary ocean/sky blue
        secondaryColor: '#38bdf8', // Light sky blue
        accentColor: '#0369a1', // Deep border blue
        x: spawnP1.x,
        y: spawnP1.y,
        vx: 0,
        vy: 0,
        width: 38,
        height: 38,
        isGrounded: false,
        facing: 'right',
        jumpCount: 0,
        health: 3,
        maxHealth: 3,
        isInExit: false,
        scaleX: 1,
        scaleY: 1,
        walkFrame: 0,
        animationState: 'idle',
        animationTimer: 0,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
      },
      james: {
        id: 'james',
        name: 'James',
        color: '#ea580c', // Vivid warm orange
        secondaryColor: '#fb923c', // Bright orange
        accentColor: '#c2410c', // Deep amber-red border
        x: spawnP2.x,
        y: spawnP2.y,
        vx: 0,
        vy: 0,
        width: 38,
        height: 38,
        isGrounded: false,
        facing: 'right',
        jumpCount: 0,
        health: 3,
        maxHealth: 3,
        isInExit: false,
        scaleX: 1,
        scaleY: 1,
        walkFrame: 0,
        animationState: 'idle',
        animationTimer: 0,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
      },
    };
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.lastTimestamp = performance.now();
    this.setupKeyboardListeners();
    soundManager.playBgm();
    this.loop(this.lastTimestamp);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cleanupKeyboardListeners();
    soundManager.stopBgm();
  }

  public resetLevel() {
    const rawLevel = getLevelById(this.level.id) || LEVEL_01;
    this.level = JSON.parse(JSON.stringify(rawLevel));
    this.activeCheckpoint = null;
    this.cameraX = 0;
    this.checkpointBanner = null;
    this.deathBanner = null;
    this.distanceWarning = false;
    this.players = this.createInitialPlayers();
    this.inputs = {
      xinyi: { left: false, right: false, jump: false },
      james: { left: false, right: false, jump: false },
    };
    this.particles = [];
    this.isLevelComplete = false;
    this.isGameOver = false;
    this.lives = 3;
    this.gemsCollected = 0;
    this.totalGems = this.level.gems ? this.level.gems.length : 0;
    this.notifyState();
  }

  public setPlayerInput(id: PlayerId | 'lumi' | 'flare', inputKey: 'left' | 'right' | 'jump', isPressed: boolean) {
    const canonicalId = (id === 'lumi' ? 'xinyi' : id === 'flare' ? 'james' : id) as PlayerId;
    if (this.inputs[canonicalId]) {
      this.inputs[canonicalId][inputKey] = isPressed;
    }
  }

  private setupKeyboardListeners() {
    this.cleanupKeyboardListeners();
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private cleanupKeyboardListeners() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent space or arrows from scrolling the webpage
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    const key = e.key.toLowerCase();

    if (this.mode === 'online') {
      // In online mode, local user controls their assigned character (onlineRole)
      // Supports both WASD and Arrow Keys / Space
      const targetInput = this.inputs[this.onlineRole];
      if (targetInput) {
        if (key === 'a' || e.key === 'ArrowLeft') targetInput.left = true;
        if (key === 'd' || e.key === 'ArrowRight') targetInput.right = true;
        if (key === 'w' || e.key === 'ArrowUp' || e.key === ' ') targetInput.jump = true;
      }
    } else {
      // Local 2-Player mode: Player 1 (Xinyi) uses A, D, W
      if (key === 'a') this.inputs.xinyi.left = true;
      if (key === 'd') this.inputs.xinyi.right = true;
      if (key === 'w') this.inputs.xinyi.jump = true;

      // Player 2 (James) uses Arrow keys
      if (e.key === 'ArrowLeft') this.inputs.james.left = true;
      if (e.key === 'ArrowRight') this.inputs.james.right = true;
      if (e.key === 'ArrowUp') this.inputs.james.jump = true;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();

    if (this.mode === 'online') {
      const targetInput = this.inputs[this.onlineRole];
      if (targetInput) {
        if (key === 'a' || e.key === 'ArrowLeft') targetInput.left = false;
        if (key === 'd' || e.key === 'ArrowRight') targetInput.right = false;
        if (key === 'w' || e.key === 'ArrowUp' || e.key === ' ') targetInput.jump = false;
      }
    } else {
      if (key === 'a') this.inputs.xinyi.left = false;
      if (key === 'd') this.inputs.xinyi.right = false;
      if (key === 'w') this.inputs.xinyi.jump = false;

      if (e.key === 'ArrowLeft') this.inputs.james.left = false;
      if (e.key === 'ArrowRight') this.inputs.james.right = false;
      if (e.key === 'ArrowUp') this.inputs.james.jump = false;
    }
  };

  public applyRemotePlayerSync(payload: PlayerSyncPayload) {
    const canonicalId = (payload.playerId === 'lumi' ? 'xinyi' : payload.playerId === 'flare' ? 'james' : payload.playerId) as PlayerId;
    if (this.mode === 'online' && canonicalId === this.onlineRole) return;
    const p = this.players[canonicalId];
    if (!p) return;

    const wasGrounded = p.isGrounded;
    const nowGrounded = payload.isGrounded;

    // Smooth interpolation with drift cutoff
    const dx = payload.x - p.x;
    const dy = payload.y - p.y;
    if (Math.abs(dx) > 75 || Math.abs(dy) > 75) {
      p.x = payload.x;
      p.y = payload.y;
    } else {
      p.x += dx * 0.8;
      p.y += dy * 0.8;
    }

    p.vx = payload.vx;
    p.vy = payload.vy;
    p.facing = payload.facing;
    p.isGrounded = payload.isGrounded;
    p.jumpCount = payload.jumpCount;
    p.health = payload.health;
    p.isInExit = payload.isInExit;
    p.scaleX = payload.scaleX;
    p.scaleY = payload.scaleY;
    p.walkFrame = payload.walkFrame;
    p.animationState = payload.animationState;

    if (!wasGrounded && nowGrounded) {
      this.spawnLandingDust(p.x + p.width / 2, p.y + p.height, p.secondaryColor);
    }
  }

  public applyRemoteButtonSync(payload: ButtonSyncPayload) {
    const btn = this.level.buttons.find((b) => b.id === payload.buttonId);
    if (btn) {
      const wasPressed = btn.isPressed;
      btn.isPressed = payload.isPressed;
      btn.pressProgress = payload.pressProgress;
      if (!wasPressed && payload.isPressed) {
        soundManager.playInteract('button');
      }
    }
  }

  public applyRemoteGateSync(payload: GateSyncPayload) {
    if (!payload || !this.level.gate) return;
    if (payload.isUnlocked || payload.state === 'OPEN') {
      this.level.gate.isUnlocked = true;
    }
    this.level.gate.state = payload.state;
    this.level.gate.isOpen = payload.isOpen;
    this.level.gate.openProgress = payload.openProgress;
    this.level.gate.minOpenTimer = payload.minOpenTimer || 0;
    this.level.gate.releaseDelayTimer = payload.releaseDelayTimer || 0;

    // Synchronize buttons from authoritative payload ONLY if they are gate buttons
    if (typeof payload.bluePressed === 'boolean') {
      const bBtn = this.level.buttons.find(
        (b) =>
          b.triggerTarget === 'gate' &&
          (b.playerTarget === 'xinyi' || b.playerTarget === 'lumi' || b.id.startsWith('btn-blue'))
      );
      if (bBtn) bBtn.isPressed = payload.bluePressed;
    }
    if (typeof payload.redPressed === 'boolean') {
      const rBtn = this.level.buttons.find(
        (b) =>
          b.triggerTarget === 'gate' &&
          (b.playerTarget === 'james' ||
            b.playerTarget === 'flare' ||
            b.id.startsWith('btn-orange') ||
            b.id.startsWith('btn-red'))
      );
      if (rBtn) rBtn.isPressed = payload.redPressed;
    }
  }

  public applyRemoteWorldSync(payload: WorldSyncPayload) {
    if (!payload || payload.levelId !== this.level.id) return;

    // 1. Moving Platforms
    if (payload.movingPlatforms && this.level.movingPlatforms) {
      for (const rMp of payload.movingPlatforms) {
        const mp = this.level.movingPlatforms.find((m) => m.id === rMp.id);
        if (mp) {
          const dist = Math.hypot(mp.x - rMp.x, mp.y - rMp.y);
          if (dist > 35) {
            mp.x = rMp.x;
            mp.y = rMp.y;
          } else if (dist > 1) {
            mp.x += (rMp.x - mp.x) * 0.5;
            mp.y += (rMp.y - mp.y) * 0.5;
          }
          mp.progress = rMp.progress;
          mp.direction = rMp.direction;
          if (typeof rMp.isUnlocked === 'boolean') mp.isUnlocked = rMp.isUnlocked;
          if (typeof rMp.pauseTimer === 'number') mp.pauseTimer = rMp.pauseTimer;
        }
      }
    }

    // 2. Bridges
    if (payload.bridges && this.level.bridges) {
      for (const rB of payload.bridges) {
        const b = this.level.bridges.find((item) => item.id === rB.id);
        if (b) {
          b.width = rB.width;
          b.openProgress = rB.openProgress;
          b.state = rB.state;
          if (typeof rB.isUnlocked === 'boolean') b.isUnlocked = rB.isUnlocked;
        }
      }
    }

    // 3. Pushable Boxes
    if (payload.boxes && this.level.boxes) {
      for (const rBox of payload.boxes) {
        const box = this.level.boxes.find((b) => b.id === rBox.id);
        if (box) {
          const dist = Math.hypot(box.x - rBox.x, box.y - rBox.y);
          if (dist > 35) {
            box.x = rBox.x;
            box.y = rBox.y;
          } else if (dist > 1.5) {
            box.x += (rBox.x - box.x) * 0.5;
            box.y += (rBox.y - box.y) * 0.5;
          }
          box.vx = rBox.vx;
          box.vy = rBox.vy;
          box.isGrounded = rBox.isGrounded;
        }
      }
    }

    // 4. Buttons (only update buttons that the local player is not actively standing on)
    if (payload.buttons) {
      for (const rBtn of payload.buttons) {
        const btn = this.level.buttons.find((b) => b.id === rBtn.id);
        if (btn && btn.playerTarget !== this.onlineRole) {
          btn.isPressed = rBtn.isPressed;
          btn.pressProgress = rBtn.pressProgress;
        }
      }
    }

    // 5. Gate
    if (payload.gate && this.level.gate) {
      this.level.gate.isOpen = payload.gate.isOpen;
      this.level.gate.openProgress = payload.gate.openProgress;
      this.level.gate.state = payload.gate.state;
      this.level.gate.isUnlocked = payload.gate.isUnlocked;
    }

    // 6. Gems
    if (payload.gems && this.level.gems) {
      for (const rGem of payload.gems) {
        const gem = this.level.gems.find((g) => g.id === rGem.id);
        if (gem) {
          if (!gem.isCollected && rGem.isCollected) {
            gem.isCollected = true;
            this.spawnGemSparkles(gem.x + gem.width / 2, gem.y + gem.height / 2, gem.glowColor || '#facc15');
          } else {
            gem.isCollected = rGem.isCollected;
          }
        }
      }
    }

    // 7. Vanishing Platforms
    if (payload.vanishingPlatforms && this.level.vanishingPlatforms) {
      for (const rVp of payload.vanishingPlatforms) {
        const vp = this.level.vanishingPlatforms.find((v) => v.id === rVp.id);
        if (vp) {
          vp.state = rVp.state;
          vp.timer = rVp.timer;
        }
      }
    }

    // 7.5 Parallel Worlds
    if (payload.currentWorld) {
      this.currentWorld = payload.currentWorld;
    }
    if (payload.worldPlatforms && this.level.worldPlatforms) {
      for (const rWp of payload.worldPlatforms) {
        const wp = this.level.worldPlatforms.find((w) => w.id === rWp.id);
        if (wp && typeof rWp.isActive === 'boolean') {
          wp.isActive = rWp.isActive;
        }
      }
    }

    // 8. Shared Lives & Gem Count
    if (typeof payload.lives === 'number') {
      this.lives = payload.lives;
    }
    if (typeof payload.gemsCollected === 'number') {
      this.gemsCollected = payload.gemsCollected;
    }

    // 9. Active Checkpoint
    if (payload.activeCheckpointId && this.level.checkpoints) {
      const cp = this.level.checkpoints.find((c) => c.id === payload.activeCheckpointId);
      if (cp && !cp.isActive) {
        cp.isActive = true;
        this.activeCheckpoint = cp;
      }
    }
  }

  public applyRemotePlayerDeath(payload: DeathSyncPayload) {
    if (!payload) return;
    soundManager.playPlayerDeath();
    const t = getCurrentTranslations();
    this.lives = Math.max(0, payload.remainingLives);
    this.deathBanner = {
      title: t.inGame.playerDownTitle,
      subtitle: this.activeCheckpoint
        ? t.inGame.respawnCheckpoint
        : t.inGame.respawnInitial,
      timer: 90,
    };

    const victim = this.players[payload.playerId === 'james' ? 'james' : 'xinyi'];
    if (victim) {
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 4;
        this.spawnParticle(
          victim.x + victim.width / 2,
          victim.y + victim.height / 2,
          Math.cos(angle) * spd,
          Math.sin(angle) * spd,
          victim.color,
          4,
          26,
          'star'
        );
      }
    }

    const respawnP1 = payload.respawnP1 || this.level.spawnP1;
    const respawnP2 = payload.respawnP2 || this.level.spawnP2;

    this.players.xinyi.x = respawnP1.x;
    this.players.xinyi.y = respawnP1.y;
    this.players.xinyi.vx = 0;
    this.players.xinyi.vy = 0;

    this.players.james.x = respawnP2.x;
    this.players.james.y = respawnP2.y;
    this.players.james.vx = 0;
    this.players.james.vy = 0;

    if (this.lives <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver();
      }
    }
  }

  public applyRemoteGemSync(payload: GemSyncPayload) {
    if (!payload || !this.level.gems) return;
    const gem = this.level.gems.find((g) => g.id === payload.gemId);
    if (gem && !gem.isCollected) {
      gem.isCollected = true;
      this.gemsCollected = payload.totalCollected;
      soundManager.playGemCollect();
      this.spawnGemSparkles(gem.x + gem.width / 2, gem.y + gem.height / 2, gem.glowColor || '#facc15');
    }
  }

  public applyRemoteCheckpointSync(payload: CheckpointSyncPayload) {
    if (!payload || !this.level.checkpoints) return;
    const cp = this.level.checkpoints.find((c) => c.id === payload.checkpointId);
    if (cp && !cp.isActive) {
      cp.isActive = true;
      this.activeCheckpoint = cp;
      soundManager.playCheckpoint();
      this.checkpointBanner = {
        text: `🚩 ${cp.label || 'CHECKPOINT ACTIVATED!'}`,
        timer: 120,
      };
      this.spawnCheckpointBurst(cp.x + cp.width / 2, cp.y + 20, '#eab308');
    }
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const delta = Math.min(33, timestamp - this.lastTimestamp);
    this.lastTimestamp = timestamp;
    this.gameTime += delta;

    this.tick(delta);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private tick(delta: number) {
    // 1. Update drifting clouds
    for (const cloud of this.level.clouds) {
      cloud.x += cloud.speed;
      if (cloud.x > this.level.width + 100) {
        cloud.x = -cloud.width - 50;
      }
    }

    // 2. Portal ambient glowing particles
    if (Math.random() < 0.35) {
      const exit = this.level.exit;
      this.spawnParticle(
        exit.x + Math.random() * exit.width,
        exit.y + exit.height - 10,
        (Math.random() - 0.5) * 0.8,
        -1.2 - Math.random() * 1.5,
        Math.random() < 0.5 ? '#38bdf8' : '#fb923c',
        3.5,
        30,
        'star'
      );
    }

    // 3. Update Moving Platforms
    if (this.level.movingPlatforms && this.level.movingPlatforms.length > 0) {
      for (const mp of this.level.movingPlatforms) {
        // If it requires a switch, check if switch is currently active
        let canMove = true;
        if (mp.requiresSwitchId) {
          const reqIds = Array.isArray(mp.requiresSwitchId)
            ? mp.requiresSwitchId
            : [mp.requiresSwitchId];
          const isAnyPressed = reqIds.some((id) => {
            const btn = this.level.buttons.find((b) => b.id === id);
            return btn ? btn.isPressed : false;
          });

          if (mp.stayActive) {
            if (isAnyPressed) {
              mp.isUnlocked = true;
              mp.isSwitchActivated = true;
            }
            canMove = isAnyPressed || Boolean(mp.isUnlocked);
          } else {
            mp.isSwitchActivated = isAnyPressed;
            canMove = isAnyPressed;
          }
        }

        if (canMove) {
          // In Level 15 Time Shift Factory, freeze moving platforms if time is paused!
          if (this.level.id === 15 && this.isTimeFrozen) {
            continue;
          }

          const totalDx = mp.endX - mp.startX;
          const totalDy = mp.endY - mp.startY;
          const totalDist = Math.hypot(totalDx, totalDy);

          if (totalDist > 0) {
            if (mp.pauseTimer && mp.pauseTimer > 0) {
              mp.pauseTimer--;
            } else {
              const step = (mp.speed / totalDist) * mp.direction;
              mp.progress += step;

              if (mp.progress >= 1) {
                mp.progress = 1;
                mp.direction = -1;
                mp.pauseTimer = 35; // ~0.6s pause before reversing
              } else if (mp.progress <= 0) {
                mp.progress = 0;
                mp.direction = 1;
                mp.pauseTimer = 35; // ~0.6s pause before reversing
              }
            }

            const oldX = mp.x;
            const oldY = mp.y;
            mp.x = mp.startX + totalDx * mp.progress;
            mp.y = mp.startY + totalDy * mp.progress;

            const moveDx = mp.x - oldX;
            const moveDy = mp.y - oldY;

            // Carry players who are standing on this platform
            // In online mode: ONLY carry the local player! The remote player calculates their own position authoritatively.
            const playersToCarry =
              this.mode === 'online'
                ? [this.players[this.onlineRole]]
                : [this.players.xinyi, this.players.james];

            for (const p of playersToCarry) {
              if (!p) continue;
              const onPlatform =
                p.isGrounded &&
                p.x + p.width > mp.x &&
                p.x < mp.x + mp.width &&
                Math.abs(p.y + p.height - mp.y) <= 14;
              if (onPlatform) {
                p.x += moveDx;
                p.y += moveDy;
              }
            }

            // Gear rotation spark particles while actively moving
            if (Math.random() < 0.25) {
              this.spawnParticle(
                mp.x + mp.width / 2 + (Math.random() - 0.5) * (mp.width * 0.7),
                mp.y + mp.height / 2,
                (Math.random() - 0.5) * 1.5,
                1 + Math.random() * 1.5,
                mp.topColor || '#38bdf8',
                2.5,
                16,
                'star'
              );
            }
          }
        }
      }
    }

    // 4. Update Falling Platforms
    if (this.level.fallingPlatforms && this.level.fallingPlatforms.length > 0) {
      for (const fp of this.level.fallingPlatforms) {
        // Check if any player is on top
        const playerOnTop = [this.players.xinyi, this.players.james].some(
          (p) =>
            p.x + p.width > fp.x &&
            p.x < fp.x + fp.width &&
            Math.abs(p.y + p.height - fp.y) <= 8
        );

        if (fp.state === 'idle' && playerOnTop) {
          fp.state = 'shaking';
          fp.timer = 25; // ~0.4 second warning shake
        } else if (fp.state === 'shaking') {
          fp.timer = (fp.timer || 25) - 1;
          if (fp.timer <= 0) {
            fp.state = 'falling';
            fp.timer = 150; // respawn after falling
          }
        } else if (fp.state === 'falling') {
          fp.y += 8;
          fp.timer = (fp.timer || 150) - 1;
          if (fp.timer <= 0) {
            fp.state = 'idle';
            fp.y = fp.initialY;
          }
        }
      }
    }

    // 5. Update Pushable Boxes physics
    if (this.level.boxes && this.level.boxes.length > 0) {
      updateBoxesPhysics(
        this.level.boxes,
        this.level.platforms,
        this.level.width,
        this.level.height,
        {
          movingPlatforms: this.level.movingPlatforms,
          conveyorBelts: this.level.conveyorBelts,
          onBoxCollision: () => {
            this.triggerBanter(undefined, undefined, '💥 BOX BATTLE!', 40);
          },
        }
      );
    }

    // 6. Update Cooperative Floor Buttons
    for (const btn of this.level.buttons) {
      let isStepping = false;

      const isTargetXinyi = btn.playerTarget === 'xinyi' || btn.playerTarget === 'lumi';
      const isTargetJames = btn.playerTarget === 'james' || btn.playerTarget === 'flare';

      // Check player stepping
      if (isTargetXinyi) {
        const p = this.players.xinyi;
        isStepping = checkAABB(
          p.x + 4,
          p.y + p.height - 6,
          p.width - 8,
          10,
          btn.x,
          btn.y,
          btn.width,
          btn.height + 4
        );
      } else if (isTargetJames) {
        const p = this.players.james;
        isStepping = checkAABB(
          p.x + 4,
          p.y + p.height - 6,
          p.width - 8,
          10,
          btn.x,
          btn.y,
          btn.width,
          btn.height + 4
        );
      } else {
        // 'any' target
        isStepping = [this.players.xinyi, this.players.james].some((p) =>
          checkAABB(
            p.x + 4,
            p.y + p.height - 6,
            p.width - 8,
            10,
            btn.x,
            btn.y,
            btn.width,
            btn.height + 4
          )
        );
      }

      // Check if a pushable crate is sitting on the button
      if (!isStepping && this.level.boxes && this.level.boxes.length > 0) {
        for (const box of this.level.boxes) {
          if (
            checkAABB(
              box.x + 4,
              box.y + box.height - 4,
              box.width - 8,
              8,
              btn.x,
              btn.y,
              btn.width,
              btn.height + 4
            )
          ) {
            isStepping = true;
            break;
          }
        }
      }

      // In online mode, local player is authoritative for their own button
      if (
        this.mode === 'local' ||
        btn.playerTarget === this.onlineRole ||
        btn.playerTarget === 'any'
      ) {
        const wasPressed = btn.isPressed;
        btn.isPressed = isStepping;

        if (!wasPressed && isStepping) {
          soundManager.playInteract('button');
        }

        if (
          this.mode === 'online' &&
          wasPressed !== isStepping &&
          this.callbacks.onLocalButtonSync
        ) {
          this.callbacks.onLocalButtonSync({
            roomCode: this.roomCode,
            buttonId: btn.id,
            isPressed: isStepping,
            pressProgress: isStepping ? 1.0 : 0.0,
            triggerTarget: btn.triggerTarget,
            playerTarget: btn.playerTarget,
          });
        }
      }

      const targetProgress = btn.isPressed ? 1.0 : 0.0;
      btn.pressProgress += (targetProgress - btn.pressProgress) * 0.25;

      // Emit energy sparkles while button is held
      if (btn.isPressed && Math.random() < 0.3) {
        this.spawnParticle(
          btn.x + Math.random() * btn.width,
          btn.y + 2,
          (Math.random() - 0.5) * 1.2,
          -1.0 - Math.random() * 1.5,
          btn.glowColor,
          3,
          22,
          'circle'
        );
      }
    }

    // 7. Update Bridges (extend or retract based on required switches)
    if (this.level.bridges && this.level.bridges.length > 0) {
      for (const b of this.level.bridges) {
        const allSwitchesOn = b.requiredSwitchIds.every((swId) => {
          const btn = this.level.buttons.find((btnItem) => btnItem.id === swId);
          return btn ? btn.isPressed : false;
        });

        if (allSwitchesOn && b.stayOpen) {
          b.isUnlocked = true;
        }

        const shouldOpen = allSwitchesOn || Boolean(b.stayOpen && b.isUnlocked);

        if (shouldOpen) {
          if (b.width < b.targetWidth) {
            b.state = 'EXTENDING';
            b.width = Math.min(b.targetWidth, b.width + 6);
            b.openProgress = b.targetWidth > 0 ? b.width / b.targetWidth : 1;
            // Sparkles on extending leading edge
            if (Math.random() < 0.4) {
              this.spawnParticle(
                b.x + b.width,
                b.y + b.height / 2 + (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 1.5,
                -1 - Math.random() * 1.5,
                b.topColor || '#f59e0b',
                3,
                18,
                'circle'
              );
            }
          } else {
            b.state = 'OPEN';
            b.openProgress = 1;
          }
        } else if (!b.stayOpen) {
          if (b.width > 0) {
            b.width = Math.max(0, b.width - 5);
            b.openProgress = b.targetWidth > 0 ? b.width / b.targetWidth : 0;
            b.state = b.width === 0 ? 'CLOSED' : 'EXTENDING';
          } else {
            b.state = 'CLOSED';
            b.openProgress = 0;
          }
        }
      }
    }

    // 8. Cooperative Gate Opening Rule & Permanent Unlocking
    const blueBtn =
      this.level.buttons.find(
        (b) =>
          (b.triggerTarget === 'gate' && (b.playerTarget === 'xinyi' || b.playerTarget === 'lumi')) ||
          (b.id.startsWith('btn-blue') && b.triggerTarget !== 'bridge' && b.triggerTarget !== 'platform')
      ) ||
      this.level.buttons.find(
        (b) =>
          b.triggerTarget !== 'bridge' &&
          b.triggerTarget !== 'platform' &&
          (b.playerTarget === 'xinyi' || b.playerTarget === 'lumi')
      );

    const redBtn =
      this.level.buttons.find(
        (b) =>
          (b.triggerTarget === 'gate' && (b.playerTarget === 'james' || b.playerTarget === 'flare')) ||
          ((b.id.startsWith('btn-orange') || b.id.startsWith('btn-red')) &&
            b.triggerTarget !== 'bridge' &&
            b.triggerTarget !== 'platform')
      ) ||
      this.level.buttons.find(
        (b) =>
          b.triggerTarget !== 'bridge' &&
          b.triggerTarget !== 'platform' &&
          (b.playerTarget === 'james' || b.playerTarget === 'flare')
      );

    const bluePressed = blueBtn ? blueBtn.isPressed : false;
    const redPressed = redBtn ? redBtn.isPressed : false;

    const prevState = this.level.gate.state;
    const prevProgress = this.level.gate.openProgress;

    const gateResult = updateGateLogic({
      gate: this.level.gate,
      bluePressed,
      redPressed,
      deltaMs: delta,
    });

    if (prevState !== 'OPEN' && gateResult.state === 'OPEN') {
      soundManager.playGateOpen();
    }

    this.level.gate.state = gateResult.state;
    this.level.gate.isOpen = gateResult.isOpen;
    this.level.gate.openProgress = gateResult.openProgress;
    this.level.gate.isUnlocked = gateResult.isUnlocked;
    this.level.gate.minOpenTimer = gateResult.minOpenTimer;
    this.level.gate.releaseDelayTimer = gateResult.releaseDelayTimer;

    // In online mode, host broadcasts gate state changes for multi-client fidelity
    if (
      this.mode === 'online' &&
      (this.onlineRole === 'xinyi' || (this.onlineRole as string) === 'lumi') &&
      this.callbacks.onLocalGateSync
    ) {
      const stateChanged = prevState !== gateResult.state;
      const progressStepped = Math.abs(prevProgress - gateResult.openProgress) > 0.08;
      if (stateChanged || progressStepped) {
        this.callbacks.onLocalGateSync({
          roomCode: this.roomCode,
          state: gateResult.state,
          isOpen: gateResult.isOpen,
          openProgress: gateResult.openProgress,
          isUnlocked: gateResult.isUnlocked,
          minOpenTimer: gateResult.minOpenTimer,
          releaseDelayTimer: gateResult.releaseDelayTimer,
          bluePressed,
          redPressed,
        });
      }
    }

    // Gate rising sparkles while opening or open
    if (
      (gateResult.state === 'OPENING' || gateResult.state === 'OPEN') &&
      this.level.gate.openProgress < 0.98 &&
      Math.random() < 0.4
    ) {
      this.spawnParticle(
        this.level.gate.x + Math.random() * this.level.gate.width,
        this.level.gate.y + this.level.gate.height * (1 - this.level.gate.openProgress),
        (Math.random() - 0.5) * 1.5,
        -1 - Math.random(),
        '#34d399',
        3,
        25,
        'star'
      );
    }

    // Decrement banner display timers
    if (this.checkpointBanner && this.checkpointBanner.timer > 0) {
      this.checkpointBanner.timer--;
      if (this.checkpointBanner.timer <= 0) this.checkpointBanner = null;
    }
    if (this.deathBanner && this.deathBanner.timer > 0) {
      this.deathBanner.timer--;
      if (this.deathBanner.timer <= 0) this.deathBanner = null;
    }
    if (this.dialogueTimer > 0) {
      this.dialogueTimer--;
      if (this.dialogueTimer <= 0) this.dialoguePrompt = null;
    }

    // Proximity banter and cooperative sparkle
    const playerDist = Math.hypot(
      this.players.xinyi.x - this.players.james.x,
      this.players.xinyi.y - this.players.james.y
    );
    if (this.proximitySparkleCooldown > 0) {
      this.proximitySparkleCooldown--;
    } else if (playerDist < 65) {
      this.proximitySparkleCooldown = 280;
      this.spawnParticle(
        (this.players.xinyi.x + this.players.james.x) / 2 + 19,
        (this.players.xinyi.y + this.players.james.y) / 2 + 19,
        0,
        -1.2,
        '#f43f5e',
        4,
        28,
        'star'
      );
      this.triggerBanter('Together! ✨', 'Together! ✨', undefined, 45);
    }

    // Level 11 Cooperative Logic (Pressure Plate + Lever, Fire-Powered Booster, Canyon Dual Sync, Conveyor, Final Transport)
    if (this.level.id === 11) {
      const isZh = getCurrentLanguage() === 'zh';

      // ---------------- MECHANISM A: PRESSURE PLATE + LEVER (Area 1) ----------------
      const plateXinyi = this.level.buttons.find((b) => b.id === 'btn-l11-plate-xinyi');
      const leverJames = this.level.buttons.find((b) => b.id === 'btn-l11-lever-james');
      const returnSw = this.level.buttons.find((b) => b.id === 'btn-l11-return-switch');
      const tempBridge = this.level.bridges?.find((b) => b.id === 'bridge-l11-temp1');

      if (returnSw?.isPressed && !this.l11ReturnLocked && tempBridge) {
        this.l11ReturnLocked = true;
        tempBridge.isUnlocked = true;
        tempBridge.stayOpen = true;
        tempBridge.state = 'OPEN';
        tempBridge.openProgress = 1;
        tempBridge.width = tempBridge.targetWidth;
        this.triggerBanter(
          isZh ? '桥梁已永久锁定！快过来，Xinyi！' : 'Bridge locked! Come across, Xinyi!',
          isZh ? '太棒了，我这就来！' : 'Awesome, on my way!',
          isZh ? '✨ 桥梁已永久锁定：双人安全通行' : '✨ BRIDGE SECURED: SAFE TO CROSS',
          90
        );
      }

      if (tempBridge && !this.l11ReturnLocked) {
        if (plateXinyi?.isPressed && leverJames?.isPressed) {
          tempBridge.stayOpen = false;
          if (this.gameTime % 60 === 0) {
            this.triggerBanter(
              isZh ? '快冲过去！我踩着压感板！' : "Sprint across! I'm holding the plate!",
              isZh ? '收到！全速冲刺！' : 'On it! Full speed!',
              isZh ? '🔥 临时桥梁展开中：离开踏板将立即回缩！' : '🔥 TEMPORARY BRIDGE EXTENDING: DO NOT STEP OFF!',
              40
            );
          }
        } else if (plateXinyi?.isPressed && !leverJames?.isPressed) {
          if (this.gameTime % 90 === 0) {
            this.triggerBanter(
              isZh ? '我踩住压感板了！James快拉动机关！' : "I'm holding the plate! James, pull the lever!",
              undefined,
              isZh ? '💧 XINYI踩住踏板：JAMES请拉动拉杆！' : '💧 XINYI: HOLDING! JAMES: PULL THE LEVER!',
              40
            );
          }
        } else if (leverJames?.isPressed && !plateXinyi?.isPressed) {
          if (this.gameTime % 90 === 0) {
            this.triggerBanter(
              undefined,
              isZh ? '拉杆没通电！Xinyi需要站在下方压感板上！' : 'No power! Xinyi needs to stand on the lower pressure plate!',
              isZh ? '⚠️ 缺少压感激活：需要XINYI站上下方蓝色踏板！' : '⚠️ UNPOWERED: XINYI MUST STAND ON BLUE PRESSURE PLATE!',
              40
            );
          }
        }
      }

      // ---------------- MECHANISM B: FIRE-POWERED JUMP LAUNCHER (Area 3) ----------------
      const unlockBtn = this.level.buttons.find((b) => b.id === 'btn-l11-booster-unlock');
      const chargeBtn = this.level.buttons.find((b) => b.id === 'btn-l11-fire-charge');
      const launchPad = this.level.buttons.find((b) => b.id === 'btn-l11-launcher-pad');
      const highLever = this.level.buttons.find((b) => b.id === 'btn-l11-high-lever');
      const rescueElev = this.level.movingPlatforms?.find((m) => m.id === 'l11-mp-rescue');

      // Check if booster charging conditions are met
      if (unlockBtn?.isPressed && chargeBtn?.isPressed) {
        if (!this.l11BoosterCharged) {
          this.l11BoosterCharged = true;
          this.triggerBanter(
            isZh ? '火焰推进器充能完毕！' : 'Flame Booster fully charged!',
            isZh ? '踩上跳板准备起飞！' : 'Step on the pad and launch!',
            isZh ? '⚡ 推进器已充能：踩上跳板高跃飞跃峭壁！' : '⚡ BOOSTER CHARGED: STEP ON PAD TO SOAR!',
            90
          );
        }
      }

      // If charged, spawn continuous magical swirling embers around the launch pad
      if (this.l11BoosterCharged && launchPad) {
        launchPad.color = '#f59e0b';
        launchPad.glowColor = '#fde047';
        if (Math.random() < 0.4) {
          this.spawnParticle(
            launchPad.x + Math.random() * launchPad.width,
            launchPad.y + 2,
            (Math.random() - 0.5) * 1.5,
            -2.5 - Math.random() * 2.0,
            Math.random() < 0.5 ? '#f59e0b' : '#fb923c',
            4,
            24,
            'star'
          );
        }
      }

      // Check player interaction with the launch pad
      if (launchPad) {
        for (const playerKey of ['james', 'xinyi'] as const) {
          const p = this.players[playerKey];
          const onPad = checkAABB(
            p.x + 4,
            p.y + p.height - 8,
            p.width - 8,
            12,
            launchPad.x,
            launchPad.y,
            launchPad.width,
            launchPad.height + 4
          );

          if (onPad) {
            if (this.l11BoosterCharged) {
              if (p.vy > -10) {
                p.vy = -18.2;
                p.isGrounded = false;
                soundManager.playJump(playerKey);
                soundManager.playInteract('lever');
                for (let i = 0; i < 16; i++) {
                  this.spawnParticle(
                    p.x + p.width / 2,
                    p.y + p.height,
                    (Math.random() - 0.5) * 6,
                    -4 - Math.random() * 6,
                    Math.random() < 0.5 ? '#f59e0b' : '#ea580c',
                    5,
                    30,
                    'star'
                  );
                }
                this.triggerBanter(
                  isZh ? '芜湖！飞上来了！' : 'Whoa! Flying high!',
                  isZh ? '太壮观了！' : 'Incredible launch!',
                  isZh ? '🚀 强力推进：飞跃绝壁！' : '🚀 SUPER LAUNCH: REACHED THE SKY LEDGE!',
                  60
                );
              }
            } else if (this.gameTime % 90 === 0) {
              this.triggerBanter(
                undefined,
                undefined,
                isZh
                  ? '⚠️ 推进器未就绪：XINYI踩住解锁踏板 & JAMES操作点火充能！'
                  : '⚠️ BOOSTER OFFLINE: XINYI UNLOCK & JAMES CHARGE IGNITION!',
                40
              );
            }
          }
        }
      }

      // High sky lever on upper cliff to lower elevator for the partner
      if (highLever?.isPressed && rescueElev && !rescueElev.isUnlocked) {
        rescueElev.isUnlocked = true;
        this.triggerBanter(
          isZh ? '我把升降梯放下去了！快上来！' : 'Lowered the elevator! Hop on!',
          isZh ? '马上就来！' : 'Right behind you!',
          isZh ? '🚠 升降梯已启动：接送队友登顶' : '🚠 RESCUE ELEVATOR DEPLOYED!',
          80
        );
      }

      // ---------------- MECHANISM C: CANYON DUAL SYNCHRONIZED SWITCHES (Area 4 & 5) ----------------
      const redSync = this.level.buttons.find((b) => b.id === 'btn-l11-canyon-red');
      const blueSync = this.level.buttons.find((b) => b.id === 'btn-l11-canyon-blue');
      const canyonBridge = this.level.bridges?.find((b) => b.id === 'bridge-l11-canyon');
      const twinElevA = this.level.movingPlatforms?.find((m) => m.id === 'l11-mp-elev-a');
      const twinElevB = this.level.movingPlatforms?.find((m) => m.id === 'l11-mp-elev-b');

      if (canyonBridge && canyonBridge.state !== 'OPEN') {
        if (redSync?.isPressed && blueSync?.isPressed) {
          canyonBridge.state = 'OPEN';
          canyonBridge.openProgress = 1;
          canyonBridge.width = canyonBridge.targetWidth;
          canyonBridge.stayOpen = true;
          canyonBridge.isUnlocked = true;
          if (twinElevA) twinElevA.isUnlocked = true;
          if (twinElevB) twinElevB.isUnlocked = true;
          this.triggerBanter(
            isZh ? '双人完美同步！' : 'Synchronized perfectly!',
            isZh ? '峡谷天桥已展开！' : 'Canyon skyway opened!',
            isZh ? '⚡ 双人同步成功：峡谷巨桥展开 & 升降梯就绪！' : '⚡ PERFECT SYNC: CANYON BRIDGE EXTENDED & LIFTS READY!',
            90
          );
        } else if (redSync?.isPressed || blueSync?.isPressed) {
          if (this.l11SyncTimer <= 0) {
            this.l11SyncTimer = 180; // 3 seconds grace period
            this.triggerBanter(
              isZh ? '我踩到开关了！' : 'Stepped on my switch!',
              isZh ? '快踩你的！' : 'Get to yours quick!',
              isZh ? '⚡ 开关1已就绪 — 请在3.0秒内踩下开关2！' : '⚡ SWITCH 1 READY — 3.0s TO HIT SWITCH 2!',
              40
            );
          } else {
            this.l11SyncTimer--;
            const remSec = (this.l11SyncTimer / 60).toFixed(1);
            if (redSync) redSync.countdownTimer = Math.round((this.l11SyncTimer / 60) * 1000);
            if (blueSync) blueSync.countdownTimer = Math.round((this.l11SyncTimer / 60) * 1000);
            if (this.l11SyncTimer === 0) {
              this.triggerBanter(
                undefined,
                undefined,
                isZh ? '⚠️ 同步超时：请两人配合同时踩下！' : '⚠️ SYNC TIMEOUT: COORDINATE AND STEP TOGETHER!',
                50
              );
            }
          }
        } else {
          this.l11SyncTimer = 0;
        }
      }

      // ---------------- AREA 6: THE HEAVY REVERSE CONVEYOR ----------------
      const stopConveyorBtn = this.level.buttons.find((b) => b.id === 'btn-l11-stop-conveyor');
      const beltDoneBtn = this.level.buttons.find((b) => b.id === 'btn-l11-belt-done');
      const conveyor = this.level.conveyorBelts?.find((c) => c.id === 'conveyor-11');
      const conveyorBridge = this.level.bridges?.find((b) => b.id === 'bridge-l11-conveyor');

      if (conveyor) {
        if (beltDoneBtn?.isPressed) {
          // Xinyi reached destination switch: halts belt & extends catwalk
          conveyor.isActive = false;
          if (conveyorBridge && conveyorBridge.state !== 'OPEN') {
            conveyorBridge.isUnlocked = true;
            conveyorBridge.stayOpen = true;
            conveyorBridge.state = 'OPEN';
            conveyorBridge.openProgress = 1;
            conveyorBridge.width = conveyorBridge.targetWidth;
            this.triggerBanter(
              isZh ? '我到了！安全步道已铺开！' : 'Made it! Catwalk deployed!',
              isZh ? '太棒了，我这就冲过去！' : 'Awesome, sprinting across!',
              isZh ? '✨ 传送带锁定：安全步道已铺开！' : '✨ CONVEYOR HALTED: CATWALK SECURED!',
              80
            );
          }
        } else if (stopConveyorBtn?.isPressed) {
          // James holds switch: reverses belt direction to RIGHT (3.5 px/f) to carry Xinyi across
          conveyor.isActive = true;
          conveyor.beltDirection = 'RIGHT';
          conveyor.speed = 3.5;
          if (this.gameTime % 70 === 0) {
            this.triggerBanter(
              isZh ? '逆风已逆转！快乘风过去！' : 'Headwind reversed! Ride the current!',
              isZh ? '我乘着强流冲过去！' : 'Riding the stream across!',
              isZh ? '🔥 强风逆转中：顺流全速冲刺！' : '🔥 CURRENT REVERSED: RIDE ACROSS!',
              35
            );
          }
        } else {
          // Default: conveyor pushes strongly LEFT (-3.2 px/f) into abyss
          conveyor.isActive = true;
          conveyor.beltDirection = 'LEFT';
          conveyor.speed = -3.2;
        }
      }

      // ---------------- AREA 7: FINAL GIANT TRANSPORT ----------------
      const redFinal = this.level.buttons.find((b) => b.id === 'btn-l11-final-red');
      const blueFinal = this.level.buttons.find((b) => b.id === 'btn-l11-final-blue');
      const finalTransport = this.level.movingPlatforms?.find((m) => m.id === 'l11-final-transport');
      if (redFinal?.isPressed && blueFinal?.isPressed && finalTransport && !this.l11FinalLaunched) {
        this.l11FinalCountdown++;
        const sec = Math.max(1, 5 - Math.floor(this.l11FinalCountdown / 60));
        this.triggerBanter(
          isZh ? '快上来！' : 'Hop on quick!',
          isZh ? '我站好了！' : "I'm in position!",
          isZh ? `🚠 浮空运输艇 ${sec} 秒后启航...` : `🚠 TRANSPORT DEPARTING IN ${sec}...`,
          30,
          sec
        );
        if (this.l11FinalCountdown >= 300) {
          this.l11FinalLaunched = true;
          finalTransport.isUnlocked = true;
          this.triggerBanter(
            isZh ? '起飞！！' : 'Off we go!!',
            isZh ? '稳稳登顶！' : 'Smooth sailing!',
            isZh ? '🚠 飞跃云海 · 抵达天空码头！' : '🚠 EN ROUTE TO SKY DOCK!',
            120
          );
        }
      }
      if (finalTransport && finalTransport.progress >= 0.95) {
        this.level.gate.isOpen = true;
        this.level.gate.state = 'OPEN';
        this.level.gate.openProgress = 1;
      }
    }

    // Level 12 Cooperative Logic (Run Together 3s Timer, Fake Switch, Final 8s Vault Lock)
    if (this.level.id === 12) {
      // Area 3: Run Together synchronized bridge
      const redRun = this.level.buttons.find((b) => b.id === 'btn-l12-run-red');
      const blueRun = this.level.buttons.find((b) => b.id === 'btn-l12-run-blue');
      const bridge3 = this.level.bridges?.find((b) => b.id === 'l12-bridge-3');
      if (bridge3 && bridge3.state !== 'OPEN') {
        if ((redRun?.isPressed || blueRun?.isPressed) && !(redRun?.isPressed && blueRun?.isPressed)) {
          if (this.l12RunTimer <= 0) {
            this.l12RunTimer = 180; // 3 seconds
            const isZh = getCurrentLanguage() === 'zh';
            this.triggerBanter(
              isZh ? '快踩你的开关！' : 'Step on your switch!',
              isZh ? '跑跑跑！' : 'Run run run!',
              '🏃 SYNCHRONIZED RUN: STEP WITHIN 3.0s!',
              45
            );
          } else {
            this.l12RunTimer--;
            if (redRun) redRun.countdownTimer = Math.round((this.l12RunTimer / 60) * 1000);
            if (blueRun) blueRun.countdownTimer = Math.round((this.l12RunTimer / 60) * 1000);
          }
        } else if (redRun?.isPressed && blueRun?.isPressed) {
          bridge3.state = 'OPEN';
          bridge3.openProgress = 1;
          bridge3.width = bridge3.targetWidth;
          this.triggerBanter('Perfect timing!', 'High five! ✋', '⚡ SYNCHRONIZED RUN SUCCESS: BRIDGE EXTENDED!', 90);
        }
      }

      // Area 6: Fake switch
      const fakeBtn = this.level.buttons.find((b) => b.id === 'btn-l12-fake');
      if (fakeBtn?.isPressed && fakeBtn.pressProgress > 0.8) {
        this.triggerBanter(undefined, undefined, '⚠️ BEEP! (Decoy Switch - Try the glowing one!)', 45);
      }

      // Area 8: Final Twin Switch with 8s timer
      const redFinal12 = this.level.buttons.find((b) => b.id === 'btn-l12-final-red');
      const blueFinal12 = this.level.buttons.find((b) => b.id === 'btn-l12-final-blue');
      if (this.level.gate.state !== 'OPEN') {
        if ((redFinal12?.isPressed || blueFinal12?.isPressed) && !(redFinal12?.isPressed && blueFinal12?.isPressed)) {
          if (this.l12FinalTimer <= 0) {
            this.l12FinalTimer = 480; // 8s
            const isZh = getCurrentLanguage() === 'zh';
            this.triggerBanter(
              isZh ? '我踩到了！' : 'I stepped on mine!',
              isZh ? '我这就过去！' : 'Heading over now!',
              '🔴 SWITCH 1 READY — 8.0s COUNTDOWN',
              60
            );
          } else {
            this.l12FinalTimer--;
            const remSec = (this.l12FinalTimer / 60).toFixed(1);
            if (redFinal12) redFinal12.countdownTimer = Math.round((this.l12FinalTimer / 60) * 1000);
            if (blueFinal12) blueFinal12.countdownTimer = Math.round((this.l12FinalTimer / 60) * 1000);
            if (this.l12FinalTimer % 60 === 0) {
              this.triggerBanter(undefined, undefined, `⏳ ${remSec}s REMAINING!`, 30);
            }
          }
        } else if (redFinal12?.isPressed && blueFinal12?.isPressed) {
          this.level.gate.isOpen = true;
          this.level.gate.state = 'OPEN';
          this.level.gate.openProgress = 1;
          this.triggerBanter('Awesome!!', 'We did it!!', '⚡ CO-OP OVERDRIVE! TEMPLE VAULT OPENED!', 120);
        }
      }
    }

    // Level 13 Cooperative Logic (Weight elevator, Cooperative elevator, Elemental plates)
    if (this.level.id === 13) {
      // Area 5: Weight elevator ascends if box is on it
      const weightElev = this.level.movingPlatforms?.find((m) => m.id === 'l13-mp-weight-elev');
      if (weightElev && this.level.boxes) {
        const hasBox = this.level.boxes.some(
          (b) =>
            b.x + b.width > weightElev.x &&
            b.x < weightElev.x + weightElev.width &&
            Math.abs(b.y + b.height - weightElev.y) <= 12
        );
        if (hasBox) {
          weightElev.isUnlocked = true;
        }
      }

      // Area 8: Cooperative elevator rises only if BOTH players stand on it
      const coopElev = this.level.movingPlatforms?.find((m) => m.id === 'l13-mp-coop-elev');
      if (coopElev) {
        const jamesOn =
          this.players.james.x + this.players.james.width > coopElev.x &&
          this.players.james.x < coopElev.x + coopElev.width &&
          Math.abs(this.players.james.y + this.players.james.height - coopElev.y) <= 14;
        const xinyiOn =
          this.players.xinyi.x + this.players.xinyi.width > coopElev.x &&
          this.players.xinyi.x < coopElev.x + coopElev.width &&
          Math.abs(this.players.xinyi.y + this.players.xinyi.height - coopElev.y) <= 14;

        if (jamesOn && xinyiOn) {
          coopElev.isUnlocked = true;
          if (coopElev.progress < 0.1) {
            const isZh = getCurrentLanguage() === 'zh';
            this.triggerBanter(
              isZh ? '站稳了！' : 'Hold steady!',
              isZh ? '出发！' : "Let's go!",
              '⚡ DUAL SENSOR DETECTED: ASCENDING',
              60
            );
          }
        }
      }

      // Area 7 & 10: Final plates
      const finalA = this.level.buttons.find((b) => b.id === 'btn-l13-plate-final-a');
      const finalB = this.level.buttons.find((b) => b.id === 'btn-l13-plate-final-b');
      if (finalA?.isPressed && finalB?.isPressed && this.level.gate.state !== 'OPEN') {
        this.level.gate.isOpen = true;
        this.level.gate.state = 'OPEN';
        this.level.gate.openProgress = 1;
        this.triggerBanter('LABORATORY CLEARED!', 'PERFECT TEAMWORK!', '🏆 ALL WEIGHT PROTOCOLS COMPLETE!', 120);
      }
    }

    // Level 14: Elemental Laser Lab (Mirrors, Controllers, Elemental Sensors)
    if (this.level.id === 14) {
      // 1. Mirror rotation button check (operable by either player, permanently latches once charged)
      const mirrorBtn = this.level.buttons.find((b) => b.id === 'btn-l14-mirror-rotate');
      const mirror = this.level.laserMirrors?.find((m) => m.id === 'mirror-l14-1');
      const reflBeam = this.level.lasers?.find((l) => l.id === 'laser-l14-reflected-beam');
      const mirrorRecv = this.level.laserReceivers?.find((r) => r.id === 'recv-l14-mirror');
      const virtMirrorBtn = this.level.buttons.find((b) => b.id === 'btn-virtual-l14-mirror-receiver');

      const isMirrorActive = Boolean(
        mirrorBtn?.isPressed || (mirrorRecv && mirrorRecv.charge >= 100)
      );

      if (mirror) {
        const nextAngle = isMirrorActive ? 45 : 135;
        if (mirror.angle !== nextAngle) {
          mirror.angle = nextAngle;
          soundManager.playInteract('mirror');
        }
      }

      // If mirror is at 45 deg, reflected vertical beam is active and charges receiver
      if (mirror && mirror.angle === 45) {
        if (reflBeam) reflBeam.isActive = true;
        if (mirrorRecv) {
          mirrorRecv.isHit = true;
          mirrorRecv.charge = Math.min(100, mirrorRecv.charge + 5);
          if (mirrorRecv.charge >= 100 && virtMirrorBtn && !virtMirrorBtn.isPressed) {
            virtMirrorBtn.isPressed = true;
            const isZh = getCurrentLanguage() === 'zh';
            this.triggerBanter(
              isZh ? '光束对准了！' : 'Beam aligned!',
              isZh ? '传感器已充能！' : 'Sensor fully charged!',
              '✨ OPTICAL FLUX REACHED 100%',
              60
            );
          }
        }
      } else {
        if (reflBeam) reflBeam.isActive = false;
        if (mirrorRecv && mirrorRecv.charge < 100) {
          mirrorRecv.isHit = false;
          mirrorRecv.charge = Math.max(0, mirrorRecv.charge - 1);
          if (mirrorRecv.charge === 0 && virtMirrorBtn) {
            virtMirrorBtn.isPressed = false;
          }
        }
      }

      // 2. Steerable Laser Controller (operable by either player, permanently latches once charged)
      const ctrlBtn = this.level.buttons.find((b) => b.id === 'btn-l14-ctrl-xinyi');
      const steerLaser = this.level.lasers?.find((l) => l.id === 'laser-l14-steerable');
      const steerRecv = this.level.laserReceivers?.find((r) => r.id === 'recv-l14-steer');
      const virtCtrlBtn = this.level.buttons.find((b) => b.id === 'btn-virtual-l14-ctrl-receiver');
      const ctrl = this.level.laserControllers?.find((c) => c.id === 'ctrl-l14-steer');

      const isSteerActive = Boolean(
        ctrlBtn?.isPressed || (steerRecv && steerRecv.charge >= 100)
      );

      if (steerLaser) {
        if (isSteerActive) {
          // Steering horizontal right directly into receiver (x: 3560 to 3720, y: 536)
          steerLaser.orientation = 'horizontal';
          steerLaser.x = 3560;
          steerLaser.y = 536;
          steerLaser.width = 160;
          steerLaser.height = 16;
          if (ctrl) ctrl.direction = 'right';
          if (steerRecv) {
            steerRecv.isHit = true;
            steerRecv.charge = Math.min(100, steerRecv.charge + 5);
            if (steerRecv.charge >= 100 && virtCtrlBtn && !virtCtrlBtn.isPressed) {
              virtCtrlBtn.isPressed = true;
              const isZh = getCurrentLanguage() === 'zh';
              this.triggerBanter(
                isZh ? '转向成功！' : 'Steering successful!',
                isZh ? '通道打开了！' : 'Path unlocked!',
                '🔵 BLUE FLUX TARGET ACTIVATED',
                60
              );
            }
          }
        } else {
          // Pointing downwards away from target (x: 3560, y: 440 to 620)
          steerLaser.orientation = 'vertical';
          steerLaser.x = 3560;
          steerLaser.y = 440;
          steerLaser.width = 16;
          steerLaser.height = 180;
          if (ctrl) ctrl.direction = 'down';
          if (steerRecv && steerRecv.charge < 100) {
            steerRecv.isHit = false;
            steerRecv.charge = Math.max(0, steerRecv.charge - 1);
            if (steerRecv.charge === 0 && virtCtrlBtn) {
              virtCtrlBtn.isPressed = false;
            }
          }
        }
      }
    }

    // Level 15: Time Shift Factory (Time pause switch, Moving time platforms, Ghost platforms)
    if (this.level.id === 15) {
      const timeBtn1 = this.level.buttons.find((b) => b.id === 'btn-l15-time-hold-1');
      const timeBtn2 = this.level.buttons.find((b) => b.id === 'btn-l15-time-hold-2');

      const isHoldingFreeze = Boolean(timeBtn1?.isPressed || timeBtn2?.isPressed);
      this.isTimeFrozen = isHoldingFreeze;

      // When time is frozen, Ghost Platforms become visible & solid
      if (this.level.ghostPlatforms && this.level.ghostPlatforms.length > 0) {
        for (const gp of this.level.ghostPlatforms) {
          gp.isVisible = isHoldingFreeze;
        }
      }

      // Timed sprint relay (8s countdown once pressed)
      const timedSprintBtn = this.level.buttons.find((b) => b.id === 'btn-l15-timed-sprint');
      const timedBridge = this.level.bridges?.find((b) => b.id === 'l15-bridge-timed');
      if (timedSprintBtn) {
        if (timedSprintBtn.isPressed) {
          if (this.l15TimedSprintTimer <= 0) {
            this.l15TimedSprintTimer = 480; // 8.0 seconds (~480 frames)
            const isZh = getCurrentLanguage() === 'zh';
            this.triggerBanter(
              isZh ? '跑跑跑！' : 'Run run run!',
              isZh ? '只有8秒时间！' : 'Only 8 seconds left!',
              '⏱️ TIMED OVERRIDE: 8.0s COUNTDOWN',
              60
            );
          }
        }
        if (this.l15TimedSprintTimer > 0) {
          this.l15TimedSprintTimer--;
          timedSprintBtn.isPressed = true;
          timedSprintBtn.countdownTimer = Math.round((this.l15TimedSprintTimer / 60) * 1000);
          if (this.l15TimedSprintTimer % 60 === 0 && this.l15TimedSprintTimer > 0) {
            const sec = (this.l15TimedSprintTimer / 60).toFixed(0);
            this.triggerBanter(undefined, undefined, `⏱️ ${sec} SECONDS REMAINING!`, 30);
          }
          if (this.l15TimedSprintTimer === 0) {
            timedSprintBtn.isPressed = false;
            timedSprintBtn.countdownTimer = 0;
            if (timedBridge) timedBridge.openProgress = 0;
            const isZh = getCurrentLanguage() === 'zh';
            this.triggerBanter(
              isZh ? '时间到了！' : "Time's up!",
              isZh ? '机关复位！' : 'Mechanism reset!',
              '⚠️ RELAY EXPIRED: RESETTING',
              60
            );
          }
        }
      }
    }

    // Level 16: Portal Dimension (Portal Direction Switch, Teleport Anchors, Quantum Swap)
    if (this.level.id === 16) {
      // 1. Portal Direction Switch (operated by Xinyi)
      const portalSwBtn = this.level.buttons.find((b) => b.id === 'btn-l16-portal-switch');
      const swPortal = this.level.teleporters?.find((t) => t.id === 'tp-l16-3-switched');
      const portalSwDef = this.level.portalSwitches?.find((ps) => ps.id === 'ps-l16-1');

      if (portalSwBtn && swPortal) {
        if (portalSwBtn.isPressed) {
          // Route to Upper Balcony (targetX: 2950, targetY: 400)
          swPortal.targetX = 2950;
          swPortal.targetY = 400;
          swPortal.color = '#a855f7';
          if (portalSwDef) portalSwDef.currentTarget = 'UPPER_CHAMBER';
        } else {
          // Route to Lower Ground (targetX: 3000, targetY: 580)
          swPortal.targetX = 3000;
          swPortal.targetY = 580;
          swPortal.color = '#38bdf8';
          if (portalSwDef) portalSwDef.currentTarget = 'LOWER_CHAMBER';
        }
      }

      // 2. Quantum Position Swap Anchors (Both standing on their anchors swaps positions & opens bridge)
      const blueAnchorBtn = this.level.buttons.find((b) => b.id === 'btn-l16-anchor-blue');
      const orangeAnchorBtn = this.level.buttons.find((b) => b.id === 'btn-l16-anchor-orange');
      const virtSwapBtn = this.level.buttons.find((b) => b.id === 'btn-virtual-l16-swap');

      if (this.l16SwapCooldown > 0) {
        this.l16SwapCooldown--;
      }

      if (blueAnchorBtn?.isPressed && orangeAnchorBtn?.isPressed && this.l16SwapCooldown === 0) {
        // Swap positions!
        const tempX = this.players.xinyi.x;
        const tempY = this.players.xinyi.y;
        this.players.xinyi.x = this.players.james.x;
        this.players.xinyi.y = this.players.james.y;
        this.players.james.x = tempX;
        this.players.james.y = tempY;

        this.spawnTeleportBurst(this.players.xinyi.x + 19, this.players.xinyi.y + 19, '#38bdf8');
        this.spawnTeleportBurst(this.players.james.x + 19, this.players.james.y + 19, '#fb923c');

        const isZh = getCurrentLanguage() === 'zh';
        this.triggerBanter(
          isZh ? '哇！我们在哪？！' : 'Whoa! Where are we?!',
          isZh ? '位置调换了！' : 'Positions swapped!',
          '🌀 QUANTUM DISPLACEMENT COMPLETE!',
          90
        );
        if (virtSwapBtn) virtSwapBtn.isPressed = true;
        this.l16SwapCooldown = 180; // 3s cooldown so it doesn't loop swap
      }
    }

    // Level 17: Vanishing Skyway - Dual Locking Stepping Stones
    if (this.level.id === 17) {
      // Check if both players stand on synchronization anchor platforms to permanently lock them safe
      const lockBtn = this.level.buttons.find((b) => b.id === 'btn-l17-sync-lock');
      if (lockBtn && lockBtn.isPressed && this.level.vanishingPlatforms) {
        for (const vp of this.level.vanishingPlatforms) {
          if (vp.id.startsWith('vp-17-bridge-')) {
            vp.state = 'safe_locked';
            vp.timer = 0;
          }
        }
      }
    }

    // Level 18: Parallel Worlds - World Switch Toggle (World A <-> World B)
    if (this.l18WorldToggleCooldown > 0) {
      this.l18WorldToggleCooldown--;
    }
    if (this.level.worldSwitches && this.level.worldSwitches.length > 0) {
      for (const ws of this.level.worldSwitches) {
        const swBtn = this.level.buttons.find((b) => b.id === ws.buttonId);
        if (swBtn && swBtn.isPressed && this.l18WorldToggleCooldown === 0) {
          if (ws.targetWorld === 'toggle') {
            this.currentWorld = this.currentWorld === 'A' ? 'B' : 'A';
          } else {
            this.currentWorld = ws.targetWorld;
          }
          this.l18WorldToggleCooldown = 45; // 0.75s debounce
          this.triggerBanter(
            undefined,
            undefined,
            `🌐 SHIFT TO WORLD ${this.currentWorld} (${this.currentWorld === 'A' ? 'BLUE / WATER DOMAIN' : 'RED / FIRE DOMAIN'})`,
            45
          );
        }
      }
    }

    // Synchronize worldPlatforms active states based on currentWorld
    if (this.level.worldPlatforms && this.level.worldPlatforms.length > 0) {
      for (const wp of this.level.worldPlatforms) {
        if (wp.world === 'both') {
          wp.isActive = true;
        } else {
          wp.isActive = wp.world === this.currentWorld;
        }
      }
    }

    // Update Cyclical & Switch-Bound Laser Hazards
    if (this.level.lasers && this.level.lasers.length > 0) {
      for (const laser of this.level.lasers) {
        if (laser.cycle) {
          const totalCycle = laser.cycle.onDurationMs + laser.cycle.offDurationMs;
          const currentMs = (this.gameTime * 16.67 + (laser.cycle.offsetMs || 0)) % totalCycle;
          laser.isActive = currentMs < laser.cycle.onDurationMs;
        }
        if (laser.switchId) {
          const sw = this.level.buttons.find((b) => b.id === laser.switchId);
          if (sw && sw.isPressed) {
            laser.isActive = false;
          }
        }
      }
    }

    // Update Vanishing Platforms (safe -> warning -> invisible -> safe)
    if (this.level.vanishingPlatforms && this.level.vanishingPlatforms.length > 0) {
      for (const vp of this.level.vanishingPlatforms) {
        if (vp.state === 'warning') {
          vp.timer++;
          if (vp.timer >= vp.warningDuration) {
            vp.state = 'invisible';
            vp.timer = 0;
          }
        } else if (vp.state === 'invisible') {
          vp.timer++;
          if (vp.timer >= vp.invisibleDuration) {
            vp.state = 'safe';
            vp.timer = 0;
          }
        }
      }
    }

    // Update Sequential Puzzle Switches (Level 19 & 20)
    if (this.level.puzzleSequence && !this.level.puzzleSequence.isSolved) {
      const seq = this.level.puzzleSequence;
      const expectedId = seq.switchIds[seq.currentIndex];
      for (let i = 0; i < seq.switchIds.length; i++) {
        const swId = seq.switchIds[i];
        const btn = this.level.buttons.find((b) => b.id === swId);
        if (btn && btn.isPressed) {
          if (swId === expectedId) {
            seq.currentIndex++;
            if (seq.currentIndex >= seq.switchIds.length) {
              seq.isSolved = true;
              this.level.gate.isOpen = true;
              this.level.gate.state = 'OPEN';
              this.level.gate.openProgress = 1;
            }
          }
        }
      }
    }

    // Dynamic physics options bundle for extra mechanics
    const physicsOptions = {
      movingPlatforms: this.level.movingPlatforms,
      boxes: this.level.boxes,
      bridges: this.level.bridges,
      fallingPlatforms: this.level.fallingPlatforms,
      hazards: this.level.hazards,
      checkpoints: this.level.checkpoints,
      teleporters: this.level.teleporters,
      lasers: this.level.lasers,
      vanishingPlatforms: this.level.vanishingPlatforms,
      conveyorBelts: this.level.conveyorBelts,
      ghostPlatforms: this.level.ghostPlatforms,
      worldPlatforms: this.level.worldPlatforms,
      playerWorld: this.currentWorld,
    };

    const respawnP1 = this.activeCheckpoint?.respawnP1 || this.level.spawnP1;
    const respawnP2 = this.activeCheckpoint?.respawnP2 || this.level.spawnP2;

    // 9. Update Xinyi physics
    if (this.mode === 'local' || this.onlineRole === 'xinyi' || (this.onlineRole as string) === 'lumi') {
      const xinyiRes = updatePlayerPhysics(
        this.players.xinyi,
        this.inputs.xinyi,
        this.level.platforms,
        this.level.gate,
        this.level.exit,
        this.level.width,
        this.level.height,
        respawnP1,
        physicsOptions
      );
      this.players.xinyi = xinyiRes.player;
      if (xinyiRes.jumped) {
        this.spawnJumpDust(
          this.players.xinyi.x + this.players.xinyi.width / 2,
          this.players.xinyi.y + this.players.xinyi.height,
          '#38bdf8'
        );
        soundManager.playJump('xinyi');
      }
      if (xinyiRes.spawnedDust) {
        this.spawnLandingDust(
          this.players.xinyi.x + this.players.xinyi.width / 2,
          this.players.xinyi.y + this.players.xinyi.height,
          '#38bdf8'
        );
      }
      if (xinyiRes.died) {
        this.handlePlayerDeath(this.players.xinyi);
      }
      if (xinyiRes.activatedCheckpointId) {
        this.handleCheckpointActivation(xinyiRes.activatedCheckpointId);
      }
      if (xinyiRes.teleported) {
        this.spawnTeleportBurst(this.players.xinyi.x + 19, this.players.xinyi.y + 19, '#38bdf8');
        soundManager.playInteract('portal');
      }
    } else {
      // Remote player slight frame animation update
      this.players.xinyi.animationTimer += delta;
      if (Math.abs(this.players.xinyi.vx) > 0.2) {
        this.players.xinyi.walkFrame += delta * 0.015;
      }
    }

    // 10. Update James physics
    if (this.mode === 'local' || this.onlineRole === 'james' || (this.onlineRole as string) === 'flare') {
      const jamesRes = updatePlayerPhysics(
        this.players.james,
        this.inputs.james,
        this.level.platforms,
        this.level.gate,
        this.level.exit,
        this.level.width,
        this.level.height,
        respawnP2,
        physicsOptions
      );
      this.players.james = jamesRes.player;
      if (jamesRes.jumped) {
        this.spawnJumpDust(
          this.players.james.x + this.players.james.width / 2,
          this.players.james.y + this.players.james.height,
          '#fb923c'
        );
        soundManager.playJump('james');
      }
      if (jamesRes.spawnedDust) {
        this.spawnLandingDust(
          this.players.james.x + this.players.james.width / 2,
          this.players.james.y + this.players.james.height,
          '#fb923c'
        );
      }
      if (jamesRes.died) {
        this.handlePlayerDeath(this.players.james);
      }
      if (jamesRes.activatedCheckpointId) {
        this.handleCheckpointActivation(jamesRes.activatedCheckpointId);
      }
      if (jamesRes.teleported) {
        this.spawnTeleportBurst(this.players.james.x + 19, this.players.james.y + 19, '#fb923c');
        soundManager.playInteract('portal');
      }
    } else {
      // Remote player slight frame animation update
      this.players.james.animationTimer += delta;
      if (Math.abs(this.players.james.vx) > 0.2) {
        this.players.james.walkFrame += delta * 0.015;
      }
    }

    // 10.5 Update Collectible Gems & Crystals
    if (this.level.gems && this.level.gems.length > 0) {
      for (const gem of this.level.gems) {
        if (gem.isCollected) continue;
        for (const p of [this.players.xinyi, this.players.james]) {
          if (gem.type === 'blue' && (p.id !== 'xinyi' && (p.id as string) !== 'lumi')) continue;
          if (gem.type === 'orange' && (p.id !== 'james' && (p.id as string) !== 'flare')) continue;

          if (checkAABB(p.x, p.y, p.width, p.height, gem.x, gem.y, gem.width, gem.height)) {
            gem.isCollected = true;
            this.gemsCollected++;
            soundManager.playGemCollect();
            this.spawnGemSparkles(gem.x + gem.width / 2, gem.y + gem.height / 2, gem.glowColor || '#facc15');

            if (this.mode === 'online' && this.callbacks.onLocalGemCollected) {
              this.callbacks.onLocalGemCollected({
                roomCode: this.roomCode,
                gemId: gem.id,
                playerId: p.id,
                totalCollected: this.gemsCollected,
              });
            }
            break;
          }
        }
      }
    }

    // High frequency network sync in online mode
    if (this.mode === 'online' && this.callbacks.onLocalPlayerSync) {
      const now = performance.now();
      if (now - this.lastSyncTime >= 24) {
        this.lastSyncTime = now;
        const localPlayer = this.players[this.onlineRole];
        this.callbacks.onLocalPlayerSync({
          roomCode: this.roomCode,
          playerId: this.onlineRole,
          x: localPlayer.x,
          y: localPlayer.y,
          vx: localPlayer.vx,
          vy: localPlayer.vy,
          facing: localPlayer.facing,
          isGrounded: localPlayer.isGrounded,
          jumpCount: localPlayer.jumpCount,
          health: localPlayer.health,
          isInExit: localPlayer.isInExit,
          scaleX: localPlayer.scaleX,
          scaleY: localPlayer.scaleY,
          walkFrame: localPlayer.walkFrame,
          animationState: localPlayer.animationState,
        });
      }
    }

    // Authoritative host world state sync (moving platforms, bridges, boxes, etc.)
    if (
      this.mode === 'online' &&
      (this.onlineRole === 'xinyi' || (this.onlineRole as string) === 'lumi') &&
      this.callbacks.onLocalWorldSync
    ) {
      const now = performance.now();
      if (now - this.lastWorldSyncTime >= 60) {
        this.lastWorldSyncTime = now;
        this.callbacks.onLocalWorldSync({
          roomCode: this.roomCode,
          levelId: this.level.id,
          timestamp: Date.now(),
          movingPlatforms: this.level.movingPlatforms?.map((mp) => ({
            id: mp.id,
            x: mp.x,
            y: mp.y,
            progress: mp.progress,
            direction: mp.direction,
            isUnlocked: mp.isUnlocked,
            pauseTimer: mp.pauseTimer,
          })),
          bridges: this.level.bridges?.map((b) => ({
            id: b.id,
            width: b.width,
            openProgress: b.openProgress,
            state: b.state,
            isUnlocked: b.isUnlocked,
          })),
          boxes: this.level.boxes?.map((box) => ({
            id: box.id,
            x: box.x,
            y: box.y,
            vx: box.vx,
            vy: box.vy,
            isGrounded: box.isGrounded,
          })),
          buttons: this.level.buttons.map((b) => ({
            id: b.id,
            isPressed: b.isPressed,
            pressProgress: b.pressProgress,
          })),
          gate: {
            isOpen: this.level.gate.isOpen,
            openProgress: this.level.gate.openProgress,
            state: this.level.gate.state,
            isUnlocked: this.level.gate.isUnlocked || false,
          },
          gems: this.level.gems?.map((g) => ({
            id: g.id,
            isCollected: g.isCollected,
          })),
          vanishingPlatforms: this.level.vanishingPlatforms?.map((vp) => ({
            id: vp.id,
            state: vp.state,
            timer: vp.timer,
          })),
          worldPlatforms: this.level.worldPlatforms?.map((wp) => ({
            id: wp.id,
            isActive: wp.isActive,
          })),
          currentWorld: this.currentWorld,
          lives: this.lives,
          gemsCollected: this.gemsCollected,
          activeCheckpointId: this.activeCheckpoint?.id || null,
        });
      }
    }

    // 11. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 12. Check level completion: Both players must be inside the exit portal AND the gate must be open!
    const isGateOpen =
      this.level.gate.isOpen ||
      this.level.gate.state === 'OPEN' ||
      this.level.gate.openProgress >= 0.85;

    const bothInExit =
      isGateOpen &&
      this.players.xinyi.isInExit &&
      this.players.james.isInExit;

    if (bothInExit && !this.isLevelComplete) {
      this.isLevelComplete = true;
      soundManager.playLevelComplete();
      this.spawnVictoryConfetti();
      if (this.callbacks.onLevelComplete) {
        this.callbacks.onLevelComplete(this.level.id);
      }
      if (this.mode === 'online' && this.callbacks.onLocalLevelComplete) {
        this.callbacks.onLocalLevelComplete(this.level.id);
      }
    }

    // Camera tracking for wide levels (level.width > 1280)
    if (this.level.width > 1280) {
      const midX = (this.players.xinyi.x + this.players.james.x) / 2;
      const targetCamX = Math.max(0, Math.min(this.level.width - 1280, midX - 640));
      this.cameraX += (targetCamX - this.cameraX) * 0.12;
    } else {
      this.cameraX = 0;
    }

    // Player Distance Manager: Restrict excessive separation
    const dist = Math.abs(this.players.xinyi.x - this.players.james.x);
    if (dist > 1900) {
      this.distanceWarning = true;
      if (this.players.xinyi.x > this.players.james.x) {
        if (this.players.xinyi.vx > 0) this.players.xinyi.vx = 0;
      } else {
        if (this.players.james.vx > 0) this.players.james.vx = 0;
      }
    } else {
      this.distanceWarning = false;
    }

    // Continuous celebration sparkle if complete
    if (this.isLevelComplete && Math.random() < 0.4) {
      this.spawnCelebrationSparkle();
    }

    this.notifyState();
  }

  private handleCheckpointActivation(checkpointId: string) {
    if (!this.level.checkpoints) return;
    const cp = this.level.checkpoints.find((c) => c.id === checkpointId);
    if (cp && !cp.isActive) {
      cp.isActive = true;
      this.activeCheckpoint = cp;
      soundManager.playCheckpoint();
      this.checkpointBanner = {
        text: `⭐ ${cp.label || 'CHECKPOINT'} ACTIVATED!`,
        timer: 140,
      };
      // Golden sparkle burst around flag
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 4;
        this.spawnParticle(
          cp.x + 6,
          cp.y + 10,
          Math.cos(angle) * spd,
          Math.sin(angle) * spd,
          '#fbbf24',
          3 + Math.random() * 2.5,
          35,
          'star'
        );
      }

      if (this.mode === 'online' && this.callbacks.onLocalCheckpointActivated) {
        this.callbacks.onLocalCheckpointActivated({
          roomCode: this.roomCode,
          checkpointId: cp.id,
          playerId: this.onlineRole,
        });
      }
    }
  }

  private spawnCheckpointBurst(cx: number, cy: number, color: string = '#fbbf24') {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 4;
      this.spawnParticle(
        cx,
        cy,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        color,
        3 + Math.random() * 2.5,
        35,
        'star'
      );
    }
  }

  private spawnTeleportBurst(cx: number, cy: number, color: string) {
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4;
      this.spawnParticle(
        cx,
        cy,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        color,
        3.5,
        30,
        'star'
      );
    }
  }

  private handlePlayerDeath(p: PlayerState) {
    soundManager.playPlayerDeath();
    const t = getCurrentTranslations();
    this.lives = Math.max(0, this.lives - 1);
    this.deathBanner = {
      title: t.inGame.playerDownTitle,
      subtitle: this.activeCheckpoint
        ? t.inGame.respawnCheckpoint
        : t.inGame.respawnInitial,
      timer: 90,
    };

    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4;
      this.spawnParticle(
        p.x + p.width / 2,
        p.y + p.height / 2,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        p.color,
        4,
        28,
        'circle'
      );
    }

    // Both players respawn at the active checkpoint
    const respawnP1 = this.activeCheckpoint?.respawnP1 || this.level.spawnP1;
    const respawnP2 = this.activeCheckpoint?.respawnP2 || this.level.spawnP2;
    this.players.xinyi.x = respawnP1.x;
    this.players.xinyi.y = respawnP1.y;
    this.players.xinyi.vx = 0;
    this.players.xinyi.vy = 0;
    this.players.james.x = respawnP2.x;
    this.players.james.y = respawnP2.y;
    this.players.james.vx = 0;
    this.players.james.vy = 0;

    // Reset temporary puzzle elements like vanishing platforms
    if (this.level.vanishingPlatforms) {
      for (const vp of this.level.vanishingPlatforms) {
        vp.state = 'safe';
        vp.timer = 0;
      }
    }

    if (this.mode === 'online' && this.callbacks.onLocalPlayerDeath) {
      this.callbacks.onLocalPlayerDeath({
        roomCode: this.roomCode,
        playerId: p.id,
        remainingLives: this.lives,
        respawnP1,
        respawnP2,
        checkpointId: this.activeCheckpoint?.id || null,
      });
    }

    if (this.lives <= 0) {
      this.isGameOver = true;
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver();
      }
    }
  }

  private spawnGemSparkles(cx: number, cy: number, color: string) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3.5;
      this.spawnParticle(
        cx,
        cy,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        color,
        3.5 + Math.random() * 2,
        28,
        'star'
      );
    }
  }

  private notifyState() {
    if (this.callbacks.onStateUpdate) {
      this.callbacks.onStateUpdate({
        xinyi: this.players.xinyi,
        james: this.players.james,
        lumi: this.players.xinyi,
        flare: this.players.james,
        isLevelComplete: this.isLevelComplete,
        currentLevelId: this.level.id,
        gateState: this.level.gate.state,
        gateOpenProgress: this.level.gate.openProgress,
        lives: this.lives,
        isGameOver: this.isGameOver,
        gemsCollected: this.gemsCollected,
        totalGems: this.totalGems,
      });
    }
  }

  private render() {
    this.renderer.render(
      this.level,
      {
        xinyi: this.players.xinyi,
        james: this.players.james,
        lumi: this.players.xinyi,
        flare: this.players.james,
      },
      this.particles,
      this.gameTime,
      this.isLevelComplete,
      this.level.id,
      {
        cameraX: this.cameraX,
        checkpointBanner: this.checkpointBanner,
        deathBanner: this.deathBanner,
        distanceWarning: this.distanceWarning,
        dialoguePrompt: this.dialoguePrompt,
      }
    );
  }

  public triggerBanter(
    xinyiText?: string,
    jamesText?: string,
    systemBanner?: string,
    durationFrames = 90,
    countdown?: number
  ) {
    this.dialoguePrompt = {
      xinyiText,
      jamesText,
      systemBanner,
      countdown,
    };
    this.dialogueTimer = durationFrames;
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number,
    maxLife: number,
    shape: 'circle' | 'star' | 'square' = 'circle'
  ) {
    this.particles.push({
      id: this.particleIdCounter++,
      x,
      y,
      vx,
      vy,
      size,
      color,
      alpha: 1,
      life: 0,
      maxLife,
      shape,
    });
  }

  private spawnJumpDust(cx: number, cy: number, color: string) {
    for (let i = 0; i < 6; i++) {
      this.spawnParticle(
        cx + (Math.random() - 0.5) * 16,
        cy - 2,
        (Math.random() - 0.5) * 3,
        -Math.random() * 1.5,
        color,
        3 + Math.random() * 2,
        18
      );
    }
  }

  private spawnLandingDust(cx: number, cy: number, color: string) {
    for (let i = 0; i < 8; i++) {
      this.spawnParticle(
        cx + (Math.random() - 0.5) * 20,
        cy - 2,
        (Math.random() - 0.5) * 4,
        -0.5 - Math.random() * 1.2,
        color,
        3 + Math.random() * 3,
        22
      );
    }
  }

  private spawnVictoryConfetti() {
    const colors = ['#38bdf8', '#fb923c', '#34d399', '#fde047', '#a855f7', '#f43f5e'];
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.spawnParticle(
        this.level.width / 2 + (Math.random() - 0.5) * 300,
        this.level.height / 2 - 100 + (Math.random() - 0.5) * 150,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        colors[Math.floor(Math.random() * colors.length)],
        4 + Math.random() * 4,
        45 + Math.floor(Math.random() * 30),
        'square'
      );
    }
  }

  private spawnCelebrationSparkle() {
    const colors = ['#38bdf8', '#fb923c', '#34d399', '#fde047'];
    const x = Math.random() * this.level.width;
    const y = Math.random() * (this.level.height * 0.7);
    this.spawnParticle(
      x,
      y,
      (Math.random() - 0.5) * 1.5,
      -1 - Math.random() * 2,
      colors[Math.floor(Math.random() * colors.length)],
      3 + Math.random() * 3,
      35,
      'star'
    );
  }
}
