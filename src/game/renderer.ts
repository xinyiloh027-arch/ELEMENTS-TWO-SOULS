import {
  Bridge,
  Checkpoint,
  Cloud,
  ConveyorBelt,
  CoopGate,
  ExitZone,
  FallingPlatform,
  FloorButton,
  GameLevel,
  Gem,
  HazardZone,
  LaserHazard,
  MovingPlatform,
  Particle,
  Platform,
  PlayerState,
  PushableBox,
  TalkingTerminal,
  Teleporter,
  VanishingPlatform,
  LaserMirror,
  LaserReceiver,
  LaserDirectionController,
  GhostPlatform,
  PortalDirectionSwitch,
  TeleportAnchor,
  WorldPlatform,
  WorldSwitch,
} from '../types';

export interface ExtraUIOptions {
  cameraX?: number;
  checkpointBanner?: { text: string; timer: number } | null;
  deathBanner?: { title: string; subtitle: string; timer: number } | null;
  distanceWarning?: boolean;
  dialoguePrompt?: {
    xinyiText?: string;
    jamesText?: string;
    systemBanner?: string;
    countdown?: number;
  } | null;
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public render(
    level: GameLevel,
    players: {
      xinyi?: PlayerState;
      james?: PlayerState;
      lumi?: PlayerState;
      flare?: PlayerState;
    },
    particles: Particle[],
    gameTime: number,
    isLevelComplete: boolean,
    levelId: number = level.id,
    extraUI?: ExtraUIOptions
  ) {
    const ctx = this.ctx;
    const viewWidth = 1280;
    const viewHeight = 720;
    const cameraX = extraUI?.cameraX ?? 0;
    const p1 = players.xinyi || players.lumi!;
    const p2 = players.james || players.flare!;

    // Clear canvas
    ctx.clearRect(0, 0, viewWidth, viewHeight);

    // 1. Render Sky Background & Warm Horizon (full screen)
    this.renderSky(viewWidth, viewHeight, gameTime, level.theme);

    // 2. Render Distant Mountains / Hills with subtle parallax
    ctx.save();
    ctx.translate(-cameraX * 0.2, 0);
    this.renderMountains(Math.max(viewWidth, level.width), viewHeight, level.theme);
    ctx.restore();

    // 3. Render Clouds with gentle parallax
    ctx.save();
    ctx.translate(-cameraX * 0.4, 0);
    this.renderClouds(level.clouds);
    ctx.restore();

    // ================= WORLD SPACE =================
    ctx.save();
    ctx.translate(-cameraX, 0);

    // 4. Render Exit Portal (Behind platforms and gate)
    this.renderExitPortal(level.exit, players, gameTime);

    // 5. Render Platforms & Ground
    this.renderPlatforms(level.platforms);

    // 6. Render Bridges
    if (level.bridges) {
      this.renderBridges(level.bridges, gameTime);
    }

    // 7. Render Moving Platforms
    if (level.movingPlatforms) {
      this.renderMovingPlatforms(level.movingPlatforms, gameTime);
    }

    // 7.5 Render Vanishing Platforms
    if (level.vanishingPlatforms) {
      this.renderVanishingPlatforms(level.vanishingPlatforms, gameTime);
    }

    // 7.6 Render Conveyor Belts
    if (level.conveyorBelts) {
      this.renderConveyorBelts(level.conveyorBelts, gameTime);
    }

    // 7.7 Render Ghost Platforms (Time Shift Factory)
    if (level.ghostPlatforms) {
      this.renderGhostPlatforms(level.ghostPlatforms, gameTime);
    }

    // 7.75 Render World Platforms (Level 18 Parallel Worlds)
    if (level.worldPlatforms) {
      this.renderWorldPlatforms(level.worldPlatforms, gameTime);
    }

    // 7.8 Render Talking Terminals
    if (level.talkingTerminals) {
      this.renderTalkingTerminals(level.talkingTerminals, gameTime);
    }

    // 8. Render Falling Platforms
    if (level.fallingPlatforms) {
      this.renderFallingPlatforms(level.fallingPlatforms, gameTime);
    }

    // 9. Render Hazards (Water, Fire, Spikes)
    if (level.hazards) {
      this.renderHazards(level.hazards, gameTime);
    }

    // 9.5 Render Color Laser Hazards (Red / Blue)
    if (level.lasers) {
      this.renderLasers(level.lasers, gameTime);
    }

    // 9.6 Render Laser Mirrors & Optical Receivers & Controllers
    if (level.laserMirrors) {
      this.renderLaserMirrors(level.laserMirrors, gameTime);
    }
    if (level.laserReceivers) {
      this.renderLaserReceivers(level.laserReceivers, gameTime);
    }
    if (level.laserControllers) {
      this.renderLaserControllers(level.laserControllers, gameTime);
    }

    // 10. Render Teleporters
    if (level.teleporters) {
      this.renderTeleporters(level.teleporters, gameTime);
    }

    // 10.5 Render Portal Switches & Teleport Anchors
    if (level.portalSwitches) {
      this.renderPortalSwitches(level.portalSwitches, gameTime);
    }
    if (level.teleportAnchors) {
      this.renderTeleportAnchors(level.teleportAnchors, gameTime);
    }

    // 11. Render Pushable Boxes
    if (level.boxes) {
      this.renderBoxes(level.boxes, gameTime);
    }

    // 12. Render Checkpoints
    if (level.checkpoints) {
      this.renderCheckpoints(level.checkpoints, gameTime);
    }

    // 12.5 Render Collectible Gems & Crystals
    if (level.gems) {
      this.renderGems(level.gems, gameTime);
    }

    // 13. Render Energy Conduit Lines from buttons to the gate / targets
    this.renderConduits(
      level.buttons,
      level.gate,
      gameTime,
      level.bridges,
      level.movingPlatforms
    );

    // 14. Render Cooperative Floor Buttons
    this.renderButtons(level.buttons, gameTime);

    // 15. Render Cooperative Gate
    this.renderCoopGate(level.gate, level.buttons, gameTime);

    // 16. Render Environmental / Jump / Spark Particles
    this.renderParticles(particles);

    // 17. Render Players with smooth animation states
    this.renderPlayer(p1, gameTime);
    this.renderPlayer(p2, gameTime);

    // 18. Render "Waiting for teammate..." overhead speech bubble if 1 player reached exit
    this.renderTeammateWaitPrompts({ xinyi: p1, james: p2, lumi: p1, flare: p2 }, gameTime);

    // 18.5 Character Dialogues & Interaction Speech Bubbles
    if (extraUI?.dialoguePrompt) {
      this.renderDialogueBubbles(p1, p2, extraUI.dialoguePrompt, gameTime);
    }

    ctx.restore();
    // ================= END WORLD SPACE =================

    // ================= SCREEN SPACE UI OVERLAYS =================
    // System dialogue / cooperative banner
    if (extraUI?.dialoguePrompt?.systemBanner) {
      this.renderSystemBanner(extraUI.dialoguePrompt.systemBanner, extraUI.dialoguePrompt.countdown, viewWidth, gameTime);
    }
    // Distance warning banner
    if (extraUI?.distanceWarning) {
      this.renderDistanceWarning(viewWidth, gameTime);
    }

    // Checkpoint activation banner
    if (extraUI?.checkpointBanner && extraUI.checkpointBanner.timer > 0) {
      this.renderCheckpointBanner(extraUI.checkpointBanner.text, viewWidth, extraUI.checkpointBanner.timer);
    }

    // Player down / returning to checkpoint banner
    if (extraUI?.deathBanner && extraUI.deathBanner.timer > 0) {
      this.renderDeathBanner(extraUI.deathBanner.title, extraUI.deathBanner.subtitle, viewWidth, viewHeight);
    }

    // 19. Level complete celebration overlay
    if (isLevelComplete) {
      this.renderLevelCompleteBanner(viewWidth, viewHeight, gameTime, level.id);
    }
  }

  private renderSky(
    width: number,
    height: number,
    time: number,
    theme?: 'sky' | 'temple' | 'industrial' | 'elemental' | 'dungeon'
  ) {
    const ctx = this.ctx;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);

    if (theme === 'temple') {
      skyGrad.addColorStop(0, '#78350f'); // Golden amber sunset
      skyGrad.addColorStop(0.45, '#b45309');
      skyGrad.addColorStop(0.8, '#fde68a');
      skyGrad.addColorStop(1, '#fef3c7');
    } else if (theme === 'industrial') {
      skyGrad.addColorStop(0, '#1e293b'); // Cool slate industrial
      skyGrad.addColorStop(0.55, '#334155');
      skyGrad.addColorStop(0.85, '#64748b');
      skyGrad.addColorStop(1, '#94a3b8');
    } else if (theme === 'elemental') {
      skyGrad.addColorStop(0, '#0f172a'); // Dual elemental dusk
      skyGrad.addColorStop(0.4, '#1e3a8a');
      skyGrad.addColorStop(0.75, '#7c2d12');
      skyGrad.addColorStop(1, '#fed7aa');
    } else if (theme === 'dungeon') {
      skyGrad.addColorStop(0, '#09090b'); // Mysterious mystic abyss
      skyGrad.addColorStop(0.5, '#18181b');
      skyGrad.addColorStop(0.85, '#27272a');
      skyGrad.addColorStop(1, '#3f3f46');
    } else {
      skyGrad.addColorStop(0, '#93c5fd'); // Soothing classic sky blue
      skyGrad.addColorStop(0.55, '#dbeafe');
      skyGrad.addColorStop(0.85, '#fef3c7');
      skyGrad.addColorStop(1, '#fed7aa');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Distant sun or mystic celestial orb with smooth radial warmth
    const sunX = width * 0.76;
    const sunY = 120 + Math.sin(time * 0.001) * 5;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 170);
    if (theme === 'dungeon') {
      sunGrad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
      sunGrad.addColorStop(0.5, 'rgba(126, 34, 206, 0.18)');
      sunGrad.addColorStop(1, 'rgba(88, 28, 135, 0)');
    } else {
      sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
      sunGrad.addColorStop(0.5, 'rgba(253, 230, 138, 0.22)');
      sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    }
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 170, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderMountains(
    width: number,
    height: number,
    theme?: 'sky' | 'temple' | 'industrial' | 'elemental' | 'dungeon'
  ) {
    const ctx = this.ctx;

    let hillColor = 'rgba(147, 197, 253, 0.45)';
    if (theme === 'temple') hillColor = 'rgba(217, 119, 6, 0.35)';
    if (theme === 'industrial') hillColor = 'rgba(71, 85, 105, 0.35)';
    if (theme === 'elemental') hillColor = 'rgba(56, 189, 248, 0.25)';
    if (theme === 'dungeon') hillColor = 'rgba(88, 28, 135, 0.25)';

    ctx.fillStyle = hillColor;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, 480);
    ctx.quadraticCurveTo(width * 0.2, 380, width * 0.4, 460);
    ctx.quadraticCurveTo(width * 0.6, 520, width * 0.8, 410);
    ctx.quadraticCurveTo(width * 0.9, 360, width, 450);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Mid-ground soft teal hills
    ctx.fillStyle = 'rgba(110, 231, 183, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, 530);
    ctx.quadraticCurveTo(width * 0.25, 470, width * 0.5, 520);
    ctx.quadraticCurveTo(width * 0.75, 570, width, 500);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }

  private renderClouds(clouds: Cloud[]) {
    const ctx = this.ctx;
    ctx.save();
    for (const c of clouds) {
      ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
      ctx.beginPath();
      const r = c.width / 5;
      ctx.arc(c.x + r * 1.5, c.y + r, r, 0, Math.PI * 2);
      ctx.arc(c.x + r * 2.5, c.y + r * 0.7, r * 1.2, 0, Math.PI * 2);
      ctx.arc(c.x + r * 3.5, c.y + r * 0.9, r * 0.9, 0, Math.PI * 2);
      ctx.rect(c.x + r * 1.5, c.y + r * 0.8, r * 2, r * 0.9);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderPlatforms(platforms: Platform[]) {
    const ctx = this.ctx;

    for (const plat of platforms) {
      const radius = plat.type === 'ground' ? 0 : 8;

      // Platform shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
      ctx.beginPath();
      ctx.roundRect(plat.x + 4, plat.y + 6, plat.width, plat.height, radius);
      ctx.fill();

      // Platform body (slate)
      ctx.fillStyle = plat.color || '#334155';
      ctx.beginPath();
      ctx.roundRect(plat.x, plat.y, plat.width, plat.height, radius);
      ctx.fill();

      // Platform surface cap
      const topH = Math.min(8, plat.height / 2);
      ctx.fillStyle = plat.topColor || '#10b981';
      ctx.beginPath();
      ctx.roundRect(plat.x, plat.y, plat.width, topH, [radius, radius, 0, 0]);
      ctx.fill();

      // Highlight line on very top edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(plat.x + 2, plat.y, plat.width - 4, 2);
    }
  }

  // Visual energy conduits from floor buttons to the central gate, bridges, or moving platforms
  private renderConduits(
    buttons: FloorButton[],
    gate: CoopGate,
    time: number,
    bridges?: Bridge[],
    movingPlatforms?: MovingPlatform[]
  ) {
    const ctx = this.ctx;
    ctx.save();

    for (const btn of buttons) {
      if (btn.x < 0 || btn.y < 0) continue;
      const isP1 = btn.playerTarget === 'xinyi' || btn.playerTarget === 'lumi';
      const startX = btn.x + btn.width / 2;
      const startY = btn.y + btn.height;

      // Check if button targets a bridge
      const targetBridge = bridges?.find((b) => b.requiredSwitchIds.includes(btn.id));

      // Check if button targets a moving platform
      const targetMp = movingPlatforms?.find((mp) => {
        if (Array.isArray(mp.requiresSwitchId)) return mp.requiresSwitchId.includes(btn.id);
        return (
          mp.requiresSwitchId === btn.id ||
          (btn.triggerTarget === 'platform' && btn.targetId === mp.id)
        );
      });

      let endX: number;
      let endY: number;

      if (targetBridge) {
        endX = targetBridge.x + 8;
        endY = targetBridge.y + targetBridge.height / 2;
      } else if (targetMp) {
        endX = targetMp.startX + targetMp.width / 2;
        endY = targetMp.startY + targetMp.height;
      } else {
        endX = gate.x + (isP1 ? 4 : gate.width - 4);
        endY = gate.y + gate.height * 0.85;
      }

      const midY = Math.max(startY + 8, Math.min(startY + 12, endY - 10));

      // Base cable pipe
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, midY);
      ctx.lineTo(endX, midY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Active energy glow
      const isLit =
        btn.isPressed ||
        Boolean(targetBridge && targetBridge.isUnlocked) ||
        Boolean(targetMp && (targetMp.isUnlocked || targetMp.isSwitchActivated));
      const activeColor = btn.glowColor || (isP1 ? '#38bdf8' : '#fb923c');
      ctx.strokeStyle = isLit ? activeColor : 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = isLit ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, midY);
      ctx.lineTo(endX, midY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Pulsing energy spark dots traveling when pressed or active
      if (isLit) {
        const pulseProg = (time * 0.003) % 1;
        const sparkX = startX + (endX - startX) * pulseProg;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sparkX, midY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Cooperative floor buttons (Xinyi Blue & James Orange)
  private renderButtons(buttons: FloorButton[], time: number) {
    const ctx = this.ctx;

    for (const btn of buttons) {
      const { x, y, width, height, isPressed, pressProgress, playerTarget } = btn;
      const depressY = pressProgress * 7; // Button presses down by up to 7px
      const currentH = Math.max(5, height - depressY);

      ctx.save();

      // Button Pedestal Base
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(x - 4, y + 6, width + 8, 6, [0, 0, 4, 4]);
      ctx.fill();

      const isP1 = playerTarget === 'xinyi' || playerTarget === 'lumi';

      // Glowing pad aura when activated
      if (pressProgress > 0.1) {
        const glowPulse = Math.sin(time * 0.01) * 3;
        ctx.fillStyle = isP1
          ? `rgba(56, 189, 248, ${0.45 * pressProgress})`
          : `rgba(251, 146, 60, ${0.45 * pressProgress})`;
        ctx.beginPath();
        ctx.ellipse(
          x + width / 2,
          y + height,
          width * 0.7 + glowPulse,
          8,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Moving Button Plunger
      const buttonColor = isPressed
        ? (isP1 ? '#38bdf8' : '#fb923c')
        : (isP1 ? '#0369a1' : '#c2410c');

      ctx.fillStyle = buttonColor;
      ctx.beginPath();
      ctx.roundRect(x, y + depressY, width, currentH, [4, 4, 2, 2]);
      ctx.fill();

      // Border highlight
      ctx.strokeStyle = isPressed ? '#ffffff' : '#475569';
      ctx.lineWidth = isPressed ? 2 : 1;
      ctx.stroke();

      // Button top highlight strip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + 3, y + depressY, width - 6, 2);

      // Icon & Text on Button / Floating Guide
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      // Indicator icon & label above button
      const floatingY = y - 10 + Math.sin(time * 0.005 + (isP1 ? 0 : Math.PI)) * 2;
      ctx.fillStyle = btn.isFake ? '#94a3b8' : (isP1 ? '#0284c7' : '#ea580c');
      if (btn.isFake) {
        ctx.fillText('⚠️ DECOY SWITCH', x + width / 2, floatingY);
      } else if (btn.weightPlate) {
        ctx.fillText(btn.label || '⚖️ WEIGHT SENSOR', x + width / 2, floatingY);
      } else {
        ctx.fillText(btn.label || (isP1 ? '🔵 XINYI 踏板' : '🟠 JAMES 踏板'), x + width / 2, floatingY);
      }

      if (btn.countdownTimer !== undefined && btn.countdownTimer > 0) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`⏳ ${(btn.countdownTimer / 1000).toFixed(1)}s`, x + width / 2, floatingY - 12);
      }

      // Status pill: ON / OFF
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = isPressed ? '#10b981' : '#64748b';
      ctx.fillText(isPressed ? '✓ 激活中' : '未踩下', x + width / 2, floatingY + 12);

      ctx.restore();
    }
  }

  // Cooperative Gate (Lifts up smoothly when both buttons are activated)
  private renderCoopGate(gate: CoopGate, buttons: FloorButton[], time: number) {
    const ctx = this.ctx;
    const { x, y, width, height, openProgress, isOpen } = gate;

    ctx.save();

    // 1. Gate Frame Columns (Left & Right stone guides)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 6, y - 6, 6, height + 10);
    ctx.fillRect(x + width, y - 6, 6, height + 10);

    // 2. Gate Top Arch / Mechanism Box
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x - 8, y - 26, width + 16, 24, 6);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dual Power Core Lights on the gate mechanism
    const xinyiPressed = buttons.find(b => b.playerTarget === 'xinyi' || b.playerTarget === 'lumi')?.isPressed ?? false;
    const jamesPressed = buttons.find(b => b.playerTarget === 'james' || b.playerTarget === 'flare')?.isPressed ?? false;

    // Xinyi Left Core
    ctx.fillStyle = xinyiPressed ? '#38bdf8' : '#334155';
    ctx.beginPath();
    ctx.arc(x + 2, y - 14, 5, 0, Math.PI * 2);
    ctx.fill();
    if (xinyiPressed) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // James Right Core
    ctx.fillStyle = jamesPressed ? '#fb923c' : '#334155';
    ctx.beginPath();
    ctx.arc(x + width - 2, y - 14, 5, 0, Math.PI * 2);
    ctx.fill();
    if (jamesPressed) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 3. Sliding Gate Body (Retracts upwards into ceiling)
    const liftY = height * openProgress;
    const currentHeight = Math.max(0, height - liftY);

    if (currentHeight > 0) {
      // Gate Body (Heavy reinforced grid / stone)
      const gateGrad = ctx.createLinearGradient(x, y, x + width, y);
      gateGrad.addColorStop(0, '#334155');
      gateGrad.addColorStop(0.5, '#475569');
      gateGrad.addColorStop(1, '#334155');
      ctx.fillStyle = gateGrad;
      ctx.beginPath();
      ctx.rect(x, y, width, currentHeight);
      ctx.fill();

      // Iron grid lines on gate body
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.lineWidth = 2;
      for (let gy = y + 16; gy < y + currentHeight; gy += 18) {
        ctx.beginPath();
        ctx.moveTo(x + 2, gy);
        ctx.lineTo(x + width - 2, gy);
        ctx.stroke();
      }

      // Energy Bar / Lock in center of gate
      const lockCenterY = y + currentHeight / 2;
      ctx.fillStyle = isOpen ? '#34d399' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(x + width / 2, lockCenterY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Overhead indicator badge matching exact specifications
    const bothPressed = xinyiPressed && jamesPressed;
    const gateState = gate.state || (isOpen ? 'OPEN' : 'CLOSED');

    ctx.save();
    const badgeCenterX = x + width / 2;
    const badgeY = y - 48;

    if (gateState === 'CLOSING') {
      // 1. DOOR CLOSING…
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      const text = 'DOOR CLOSING…';
      const tw = ctx.measureText(text).width;

      // Dark card with pulsing red/orange border
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(badgeCenterX - tw / 2 - 12, badgeY - 14, tw + 24, 26, 13);
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.fillText(text, badgeCenterX, badgeY + 4);
    } else if (gateState === 'OPEN' || gateState === 'OPENING') {
      if (bothPressed) {
        // 2. DOOR OPEN!
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        const text = 'DOOR OPEN!';
        const tw = ctx.measureText(text).width;

        // Radiant emerald card
        const pulse = Math.sin(time * 0.008) * 2;
        ctx.fillStyle = 'rgba(6, 78, 59, 0.92)';
        ctx.beginPath();
        ctx.roundRect(badgeCenterX - tw / 2 - 14, badgeY - 15, tw + 28, 28, 14);
        ctx.fill();
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, badgeCenterX, badgeY + 5);

        // Subtitle: Players can pass
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText('两名玩家可通行 · 踩住保持开启', badgeCenterX, badgeY + 24);
      } else {
        // 3. KEEP THE SWITCHES ACTIVE! (One player stepped off, door held by safety guarantee)
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        const text = 'KEEP THE SWITCHES ACTIVE!';
        const tw = ctx.measureText(text).width;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.94)';
        ctx.beginPath();
        ctx.roundRect(badgeCenterX - tw / 2 - 12, badgeY - 14, tw + 24, 26, 13);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.fillText(text, badgeCenterX, badgeY + 4);

        // Remaining safety timer bar or text
        const safeTimerSec = ((gate.minOpenTimer || 0) / 1000).toFixed(1);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#fde68a';
        if ((gate.minOpenTimer || 0) > 0) {
          ctx.fillText(`安全保持中: ${safeTimerSec}s · 请保持踩下`, badgeCenterX, badgeY + 23);
        } else {
          ctx.fillText('踏板已释放 · 即将关门', badgeCenterX, badgeY + 23);
        }
      }
    } else {
      // 4. CLOSED state
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('🔒 双人机关门', badgeCenterX, badgeY + 8);

      let hintText = '需两人同时踩住蓝橙踏板';
      if (xinyiPressed && !jamesPressed) hintText = '等待 James 踩下橙色踏板!';
      if (!xinyiPressed && jamesPressed) hintText = '等待 Xinyi 踩下蓝色踏板!';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = (xinyiPressed || jamesPressed) ? '#fbbf24' : '#94a3b8';
      ctx.fillText(hintText, badgeCenterX, badgeY - 8);
    }

    ctx.restore();

    ctx.restore();
  }

  private renderExitPortal(
    exit: ExitZone,
    players: {
      xinyi?: PlayerState;
      james?: PlayerState;
      lumi?: PlayerState;
      flare?: PlayerState;
    },
    time: number
  ) {
    const ctx = this.ctx;
    const { x, y, width, height } = exit;
    const p1 = players.xinyi || players.lumi!;
    const p2 = players.james || players.flare!;
    const bothInside = p1.isInExit && p2.isInExit;

    ctx.save();

    // 1. Soft glowing aura behind the door
    const auraPulse = Math.sin(time * 0.005) * 6;
    const auraGrad = ctx.createRadialGradient(
      x + width / 2,
      y + height / 2,
      10,
      x + width / 2,
      y + height / 2,
      width + auraPulse
    );
    if (bothInside) {
      auraGrad.addColorStop(0, 'rgba(52, 211, 153, 0.85)');
      auraGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.45)');
      auraGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
    } else {
      auraGrad.addColorStop(0, 'rgba(96, 165, 250, 0.45)');
      auraGrad.addColorStop(0.5, 'rgba(251, 146, 60, 0.3)');
      auraGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
    }
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, width + auraPulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stone Archway Frame
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x - 6, y - 6, width + 12, height + 6, [width / 2, width / 2, 4, 4]);
    ctx.fill();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. Inner Portal Energy
    const innerGrad = ctx.createLinearGradient(x, y, x, y + height);
    if (bothInside) {
      innerGrad.addColorStop(0, '#10b981');
      innerGrad.addColorStop(0.5, '#34d399');
      innerGrad.addColorStop(1, '#059669');
    } else {
      innerGrad.addColorStop(0, '#38bdf8');
      innerGrad.addColorStop(0.5, '#a855f7');
      innerGrad.addColorStop(1, '#f97316');
    }
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, width - 8, height - 4, [width / 2, width / 2, 0, 0]);
    ctx.fill();

    // Swirling portal ripple circles
    const rippleCount = 3;
    for (let i = 0; i < rippleCount; i++) {
      const progress = ((time * 0.002 + i * 0.33) % 1);
      const rippleR = progress * (width * 0.42);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * (1 - progress)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(
        x + width / 2,
        y + height * 0.55,
        rippleR,
        rippleR * 1.3,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // 4. "EXIT" Plaque on Top
    const signW = width + 28;
    const signH = 26;
    const signX = x + width / 2 - signW / 2;
    const signY = y - signH - 4;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(signX, signY, signW, signH, 6);
    ctx.fill();

    ctx.strokeStyle = bothInside ? '#34d399' : '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // "EXIT" Text
    ctx.fillStyle = bothInside ? '#6ee7b7' : '#fbbf24';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', x + width / 2, signY + signH / 2);

    // 5. Dual Player Presence Indicators at bottom of portal
    const padY = y + height - 12;
    // Xinyi indicator (Blue)
    ctx.fillStyle = p1.isInExit ? '#38bdf8' : 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.arc(x + width * 0.32, padY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // James indicator (Orange)
    ctx.fillStyle = p2.isInExit ? '#fb923c' : 'rgba(251, 146, 60, 0.25)';
    ctx.beginPath();
    ctx.arc(x + width * 0.68, padY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Waiting for teammate banner / overhead callout
  private renderTeammateWaitPrompts(
    players: {
      xinyi?: PlayerState;
      james?: PlayerState;
      lumi?: PlayerState;
      flare?: PlayerState;
    },
    time: number
  ) {
    const p1 = players.xinyi || players.lumi!;
    const p2 = players.james || players.flare!;
    const oneInside = (p1.isInExit && !p2.isInExit) || (!p1.isInExit && p2.isInExit);

    if (!oneInside) return;

    const ctx = this.ctx;
    const waitingPlayer = p1.isInExit ? p1 : p2;
    const isP1 = waitingPlayer.id === 'xinyi' || (waitingPlayer.id as string) === 'lumi';
    const absentName = isP1 ? 'James' : 'Xinyi';

    ctx.save();
    const bubbleX = waitingPlayer.x + waitingPlayer.width / 2;
    const bubbleY = waitingPlayer.y - 48 + Math.sin(time * 0.008) * 3;

    // Speech bubble card
    const text = `Waiting for teammate... (${absentName} ⏳)`;
    ctx.font = 'bold 12px sans-serif';
    const textWidth = ctx.measureText(text).width;
    const bw = textWidth + 24;
    const bh = 28;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(bubbleX - bw / 2, bubbleY - bh / 2, bw, bh, 8);
    ctx.fill();

    ctx.strokeStyle = isP1 ? '#38bdf8' : '#fb923c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Speech bubble triangle tail
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.moveTo(bubbleX - 5, bubbleY + bh / 2);
    ctx.lineTo(bubbleX, bubbleY + bh / 2 + 6);
    ctx.lineTo(bubbleX + 5, bubbleY + bh / 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bubbleX, bubbleY);

    ctx.restore();
  }

  // Detailed Character Rendering with 5 Animation States:
  // idle, run, jump, fall, hurt
  private renderPlayer(player: PlayerState, time: number) {
    const ctx = this.ctx;
    const { x, y, width, height, scaleX, scaleY, facing, animationState } = player;

    ctx.save();

    const cx = x + width / 2;
    const cy = y + height / 2;

    ctx.translate(cx, cy);

    // State-specific tilts and bobbing
    let bodyTilt = 0;
    let walkBob = 0;
    let idleBreath = 0;

    if (animationState === 'run') {
      bodyTilt = facing === 'left' ? -0.08 : 0.08;
      walkBob = Math.sin(player.walkFrame * 2) * 2.5;
    } else if (animationState === 'idle') {
      idleBreath = Math.sin(time * 0.005) * 1.5;
    } else if (animationState === 'jump') {
      bodyTilt = facing === 'left' ? -0.05 : 0.05;
    } else if (animationState === 'fall') {
      bodyTilt = facing === 'left' ? 0.03 : -0.03;
    } else if (animationState === 'hurt') {
      bodyTilt = (Math.sin(time * 0.05) * 0.15);
    }

    ctx.rotate(bodyTilt);
    ctx.scale(scaleX, scaleY);

    // Drop shadow under player
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, height / 2 + 3 - walkBob, width * 0.45, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body dimensions
    const bodyW = width - 4;
    const bodyH = height - 4 + idleBreath;
    const cornerR = Math.min(bodyW, bodyH) / 2;

    // Gradient filling
    const bodyGrad = ctx.createLinearGradient(0, -bodyH / 2, 0, bodyH / 2);
    bodyGrad.addColorStop(0, player.secondaryColor);
    bodyGrad.addColorStop(1, player.color);

    // Body shape
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-bodyW / 2, -bodyH / 2 + walkBob, bodyW, bodyH, cornerR);
    ctx.fill();

    // Body outline
    ctx.strokeStyle = player.accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Specular highlight (top-left)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-bodyW * 0.22, -bodyH * 0.25 + walkBob, bodyW * 0.2, bodyH * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // James distinct feature: cute flame curl on head
    if (player.id === 'james' || (player.id as string) === 'flare') {
      const flameFlicker = Math.sin(time * 0.012) * 2.5;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-4, -bodyH / 2 + walkBob);
      ctx.quadraticCurveTo(0, -bodyH / 2 - 15 + flameFlicker, 4, -bodyH / 2 + walkBob);
      ctx.closePath();
      ctx.fill();

      // Flame core
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(-2, -bodyH / 2 + walkBob);
      ctx.quadraticCurveTo(0, -bodyH / 2 - 9 + flameFlicker, 2, -bodyH / 2 + walkBob);
      ctx.closePath();
      ctx.fill();
    }

    // Xinyi distinct feature: cute starry halo/antenna
    if (player.id === 'xinyi' || (player.id as string) === 'lumi') {
      const glowPulse = Math.sin(time * 0.008) * 1.5;
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(0, -bodyH / 2 - 6 + glowPulse + walkBob, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -bodyH / 2 - 6 + glowPulse + walkBob, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyes direction and expressions based on Animation State
    const eyeOffsetX = facing === 'left' ? -6 : 6;
    const eyeSpacing = 8;
    let eyeY = -2 + walkBob;

    if (animationState === 'jump') eyeY -= 2;
    if (animationState === 'fall') eyeY += 1;

    // Rosy blush cheeks
    ctx.fillStyle = (player.id === 'xinyi' || (player.id as string) === 'lumi') ? 'rgba(56, 189, 248, 0.45)' : 'rgba(251, 113, 133, 0.55)';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + eyeOffsetX - 3, eyeY + 7, 3.5, 0, Math.PI * 2);
    ctx.arc(eyeSpacing + eyeOffsetX + 3, eyeY + 7, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (animationState === 'hurt') {
      // Dizzy > < eyes
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      // Left eye >
      ctx.beginPath();
      ctx.moveTo(-eyeSpacing + eyeOffsetX - 3, eyeY - 3);
      ctx.lineTo(-eyeSpacing + eyeOffsetX + 2, eyeY);
      ctx.lineTo(-eyeSpacing + eyeOffsetX - 3, eyeY + 3);
      ctx.stroke();
      // Right eye <
      ctx.beginPath();
      ctx.moveTo(eyeSpacing + eyeOffsetX + 3, eyeY - 3);
      ctx.lineTo(eyeSpacing + eyeOffsetX - 2, eyeY);
      ctx.lineTo(eyeSpacing + eyeOffsetX + 3, eyeY + 3);
      ctx.stroke();
    } else {
      // Normal / Happy cute round eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-eyeSpacing + eyeOffsetX, eyeY, 4, 0, Math.PI * 2);
      ctx.arc(eyeSpacing + eyeOffsetX, eyeY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Eye catchlights (sparkle)
      ctx.fillStyle = '#ffffff';
      const catchX = facing === 'left' ? -1 : 1;
      ctx.beginPath();
      ctx.arc(-eyeSpacing + eyeOffsetX + catchX, eyeY - 1.5, 1.5, 0, Math.PI * 2);
      ctx.arc(eyeSpacing + eyeOffsetX + catchX, eyeY - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouth
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (animationState === 'jump') {
      // Open mouth happy :O
      ctx.arc(eyeOffsetX, eyeY + 4, 3, 0, Math.PI * 2);
    } else {
      // Sweet smile :)
      ctx.arc(eyeOffsetX, eyeY + 4, 3.5, 0.1, Math.PI - 0.1, false);
    }
    ctx.stroke();

    // Feet / Little cute stepping paws
    const stepL = animationState === 'run' ? Math.sin(player.walkFrame) * 4 : 0;
    const stepR = animationState === 'run' ? -Math.sin(player.walkFrame) * 4 : 0;
    ctx.fillStyle = player.accentColor;
    ctx.beginPath();
    ctx.arc(-8, bodyH / 2 - 2 + (player.isGrounded ? stepL : 2), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, bodyH / 2 - 2 + (player.isGrounded ? stepR : 2), 4, 0, Math.PI * 2);
    ctx.fill();

    // Name badge above player
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const tagText = player.name;
    const textWidth = ctx.measureText(tagText).width;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(-textWidth / 2 - 8, -bodyH / 2 - 28, textWidth + 16, 18, 9);
    ctx.fill();

    ctx.fillStyle = (player.id === 'xinyi' || (player.id as string) === 'lumi') ? '#38bdf8' : '#fb923c';
    ctx.fillText(tagText, 0, -bodyH / 2 - 13);

    ctx.restore();
  }

  private renderParticles(particles: Particle[]) {
    const ctx = this.ctx;
    ctx.save();
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderBridges(bridges: Bridge[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const b of bridges) {
      if (b.width <= 0) continue;

      // Drop shadow for the bridge span
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(b.x, b.y + 4, b.width, b.height);

      // Support suspension cable on top
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y - 12);
      ctx.lineTo(b.x + b.width, b.y - 12);
      ctx.stroke();

      // Slats and main wooden deck
      ctx.fillStyle = b.color || '#78350f';
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Planks pattern
      const plankStep = 18;
      ctx.fillStyle = b.topColor || '#f59e0b';
      for (let px = b.x; px < b.x + b.width; px += plankStep) {
        ctx.fillRect(px, b.y, Math.min(14, b.x + b.width - px), 5);
        // Hanging chain link from cable to plank
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 7, b.y - 12);
        ctx.lineTo(px + 7, b.y);
        ctx.stroke();
      }

      // Extending gear indicator on right leading edge if moving
      if (b.state === 'EXTENDING') {
        const gearX = b.x + b.width;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(gearX, b.y + b.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private renderMovingPlatforms(movingPlatforms: MovingPlatform[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const mp of movingPlatforms) {
      const isPowered = !mp.requiresSwitchId || mp.isUnlocked || mp.isSwitchActivated;

      // Guide rail track line between start and end
      ctx.strokeStyle = isPowered ? 'rgba(56, 189, 248, 0.4)' : 'rgba(100, 116, 139, 0.25)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(mp.startX + mp.width / 2, mp.startY + mp.height / 2);
      ctx.lineTo(mp.endX + mp.width / 2, mp.endY + mp.height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Drop shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.beginPath();
      ctx.roundRect(mp.x + 3, mp.y + 4, mp.width, mp.height, 6);
      ctx.fill();

      // Platform body
      ctx.fillStyle = isPowered ? (mp.color || '#0284c7') : '#334155';
      ctx.beginPath();
      ctx.roundRect(mp.x, mp.y, mp.width, mp.height, 6);
      ctx.fill();

      // Top glowing safety strip
      ctx.fillStyle = isPowered ? (mp.topColor || '#38bdf8') : '#64748b';
      ctx.beginPath();
      ctx.roundRect(mp.x, mp.y, mp.width, 6, [6, 6, 0, 0]);
      ctx.fill();

      // Mechanical gear in center of platform
      const pulse = isPowered ? Math.sin(time * 0.006) * 2 : 0;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(mp.x + mp.width / 2, mp.y + mp.height / 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isPowered ? (mp.topColor || '#38bdf8') : '#94a3b8';
      ctx.beginPath();
      ctx.arc(mp.x + mp.width / 2, mp.y + mp.height / 2, 3.5 + pulse * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Rotating gear teeth when powered
      if (isPowered) {
        ctx.strokeStyle = mp.topColor || '#38bdf8';
        ctx.lineWidth = 1.5;
        const angle = (time * 0.003 * mp.direction) % (Math.PI * 2);
        for (let i = 0; i < 4; i++) {
          const a = angle + (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(
            mp.x + mp.width / 2 + Math.cos(a) * 4,
            mp.y + mp.height / 2 + Math.sin(a) * 4
          );
          ctx.lineTo(
            mp.x + mp.width / 2 + Math.cos(a) * 8,
            mp.y + mp.height / 2 + Math.sin(a) * 8
          );
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  private renderFallingPlatforms(fallingPlatforms: FallingPlatform[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const fp of fallingPlatforms) {
      if (fp.state === 'falling' && fp.y > 800) continue;

      let jitterX = 0;
      if (fp.state === 'shaking') {
        jitterX = (Math.random() - 0.5) * 5;
      }

      const drawX = fp.x + jitterX;
      const drawY = fp.y;

      // Platform slab
      ctx.fillStyle = fp.color || '#475569';
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, fp.width, fp.height, 4);
      ctx.fill();

      // Surface
      ctx.fillStyle = fp.state === 'shaking' ? '#f87171' : (fp.topColor || '#e2e8f0');
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, fp.width, 5, [4, 4, 0, 0]);
      ctx.fill();

      // Crack lines if shaking
      if (fp.state === 'shaking') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(drawX + fp.width * 0.3, drawY + 1);
        ctx.lineTo(drawX + fp.width * 0.45, drawY + fp.height - 2);
        ctx.moveTo(drawX + fp.width * 0.65, drawY + 2);
        ctx.lineTo(drawX + fp.width * 0.8, drawY + fp.height - 3);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderHazards(hazards: HazardZone[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const hz of hazards) {
      if (hz.type === 'water') {
        // Glowing water pool
        const grad = ctx.createLinearGradient(0, hz.y, 0, hz.y + hz.height);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
        grad.addColorStop(1, 'rgba(3, 105, 161, 0.9)');
        ctx.fillStyle = grad;
        ctx.fillRect(hz.x, hz.y, hz.width, hz.height);

        // Sine wave ripple on surface
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = hz.x; x <= hz.x + hz.width; x += 6) {
          const waveY = hz.y + Math.sin(time * 0.006 + x * 0.08) * 3;
          if (x === hz.x) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();

        // Water droplet icon / label
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.textAlign = 'center';
        ctx.fillText('💧 XINYI ONLY', hz.x + hz.width / 2, hz.y + hz.height / 2 + 4);
      } else if (hz.type === 'fire') {
        // Glowing fire pit
        const grad = ctx.createLinearGradient(0, hz.y, 0, hz.y + hz.height);
        grad.addColorStop(0, 'rgba(249, 115, 22, 0.85)');
        grad.addColorStop(1, 'rgba(185, 28, 28, 0.95)');
        ctx.fillStyle = grad;
        ctx.fillRect(hz.x, hz.y, hz.width, hz.height);

        // Flickering fire sparks
        ctx.fillStyle = '#fef08a';
        for (let fx = hz.x + 8; fx < hz.x + hz.width - 8; fx += 16) {
          const flickerH = Math.sin(time * 0.01 + fx) * 5 + 6;
          ctx.beginPath();
          ctx.moveTo(fx, hz.y);
          ctx.lineTo(fx + 5, hz.y - flickerH);
          ctx.lineTo(fx + 10, hz.y);
          ctx.fill();
        }

        // Fire flame icon / label
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText('🔥 JAMES ONLY', hz.x + hz.width / 2, hz.y + hz.height / 2 + 4);
      }
    }
    ctx.restore();
  }

  private renderTeleporters(teleporters: Teleporter[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const tp of teleporters) {
      const cx = tp.x + tp.width / 2;
      const cy = tp.y + tp.height / 2;

      // Swirling outer ring
      const rot = time * 0.003;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      ctx.strokeStyle = tp.color || '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, tp.width / 2 - 2, 0, Math.PI * 1.6);
      ctx.stroke();

      ctx.restore();

      // Glowing inner core
      const pulse = Math.sin(time * 0.006) * 4;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, tp.width / 2);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, tp.color || '#38bdf8');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, tp.width / 2 - 4 + pulse * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Label
      if (tp.label) {
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(tp.label, cx, tp.y - 6);
      }
    }
    ctx.restore();
  }

  private renderBoxes(boxes: PushableBox[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const b of boxes) {
      // Box shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(b.x + 3, b.y + 4, b.width, b.height);

      const isFire = b.element === 'fire' || b.pushableBy === 'james';
      const isWater = b.element === 'water' || b.pushableBy === 'xinyi';

      // Crate body
      let bodyColor = b.color || '#b45309';
      if (isFire) bodyColor = '#9a3412';
      if (isWater) bodyColor = '#0369a1';

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.width, b.height, 4);
      ctx.fill();

      // Inner border frame
      let strokeColor = b.accentColor || '#d97706';
      if (isFire) strokeColor = '#ea580c';
      if (isWater) strokeColor = '#38bdf8';

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x + 4, b.y + 4, b.width - 8, b.height - 8);

      // Diagonal cross brace
      ctx.strokeStyle = isFire ? 'rgba(234, 88, 12, 0.6)' : isWater ? 'rgba(56, 189, 248, 0.6)' : 'rgba(120, 53, 15, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x + 5, b.y + 5);
      ctx.lineTo(b.x + b.width - 5, b.y + b.height - 5);
      ctx.moveTo(b.x + b.width - 5, b.y + 5);
      ctx.lineTo(b.x + 5, b.y + b.height - 5);
      ctx.stroke();

      // Corner rivets
      ctx.fillStyle = isFire ? '#fde047' : isWater ? '#e0f2fe' : '#fde68a';
      const r = 2;
      ctx.beginPath();
      ctx.arc(b.x + 6, b.y + 6, r, 0, Math.PI * 2);
      ctx.arc(b.x + b.width - 6, b.y + 6, r, 0, Math.PI * 2);
      ctx.arc(b.x + 6, b.y + b.height - 6, r, 0, Math.PI * 2);
      ctx.arc(b.x + b.width - 6, b.y + b.height - 6, r, 0, Math.PI * 2);
      ctx.fill();

      // Elemental icon in center of crate
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isFire) {
        ctx.fillText('🔥', b.x + b.width / 2, b.y + b.height / 2);
      } else if (isWater) {
        ctx.fillText('💧', b.x + b.width / 2, b.y + b.height / 2);
      } else {
        ctx.fillText('📦', b.x + b.width / 2, b.y + b.height / 2);
      }

      // Box label if provided
      if (b.label) {
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(b.label, b.x + b.width / 2, b.y - 8);
      }
    }
    ctx.restore();
  }

  private renderCheckpoints(checkpoints: Checkpoint[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const cp of checkpoints) {
      const poleX = cp.x + 6;
      const poleY = cp.y;
      const poleH = cp.height;

      // Base pedestal
      ctx.fillStyle = cp.isActive ? '#854d0e' : '#1e293b';
      ctx.fillRect(poleX - 8, poleY + poleH - 8, 20, 8);
      ctx.strokeStyle = cp.isActive ? '#fbbf24' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(poleX - 8, poleY + poleH - 8, 20, 8);

      // Pole
      ctx.fillStyle = cp.isActive ? '#f59e0b' : '#475569';
      ctx.fillRect(poleX, poleY, 4, poleH);

      // Active Golden Halo & Glow
      if (cp.isActive) {
        const glowPulse = 0.7 + Math.sin(time * 0.008) * 0.3;
        const radialGrad = ctx.createRadialGradient(poleX + 2, poleY - 4, 3, poleX + 2, poleY - 4, 32);
        radialGrad.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
        radialGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
        radialGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = radialGrad;
        ctx.beginPath();
        ctx.arc(poleX + 2, poleY - 4, 32 * glowPulse, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle orbiting specks
        for (let i = 0; i < 4; i++) {
          const angle = time * 0.003 + (i * Math.PI) / 2;
          const sx = poleX + 2 + Math.cos(angle) * 16;
          const sy = poleY - 4 + Math.sin(angle) * 12;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Top Orb
      ctx.fillStyle = cp.isActive ? '#fde047' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(poleX + 2, poleY - 4, cp.isActive ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();

      // Waving Flag
      const wave = Math.sin(time * 0.006) * 5;
      ctx.fillStyle = cp.isActive ? '#fbbf24' : '#64748b';
      ctx.beginPath();
      ctx.moveTo(poleX + 4, poleY - 2);
      ctx.quadraticCurveTo(poleX + 18, poleY + wave, poleX + 32, poleY + 6);
      ctx.lineTo(poleX + 4, poleY + 18);
      ctx.closePath();
      ctx.fill();

      // Gold trim on active flag
      if (cp.isActive) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Star symbol on active flag
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#78350f';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', poleX + 16, poleY + 10 + wave * 0.5);
      }

      // Label
      if (cp.label) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = cp.isActive ? '#fde047' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(cp.isActive ? `⭐ ${cp.label}` : cp.label, poleX + 12, poleY - 14);
      }
    }
    ctx.restore();
  }

  private renderLasers(lasers: LaserHazard[], time: number) {
    const ctx = this.ctx;
    ctx.save();

    for (const laser of lasers) {
      const isRed = laser.colorType === 'red';
      const mainColor = isRed ? '#ef4444' : '#0284c7';
      const glowColor = isRed ? '#f87171' : '#38bdf8';
      const safeRole = isRed ? '🔥 JAMES' : '💧 XINYI';

      // Laser emitters (pods at both ends)
      const isVertical = laser.orientation === 'vertical' || !laser.orientation;

      // Draw top/start emitter
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2;
      if (isVertical) {
        ctx.fillRect(laser.x - 4, laser.y, laser.width + 8, 8);
        ctx.strokeRect(laser.x - 4, laser.y, laser.width + 8, 8);
        ctx.fillRect(laser.x - 4, laser.y + laser.height - 8, laser.width + 8, 8);
        ctx.strokeRect(laser.x - 4, laser.y + laser.height - 8, laser.width + 8, 8);
      } else {
        ctx.fillRect(laser.x, laser.y - 4, 8, laser.height + 8);
        ctx.strokeRect(laser.x, laser.y - 4, 8, laser.height + 8);
        ctx.fillRect(laser.x + laser.width - 8, laser.y - 4, 8, laser.height + 8);
        ctx.strokeRect(laser.x + laser.width - 8, laser.y - 4, 8, laser.height + 8);
      }

      if (laser.isActive) {
        const pulse = 0.8 + Math.sin(time * 0.015 + laser.x) * 0.2;

        // Outer glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 16 * pulse;
        ctx.fillStyle = mainColor;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);

        // Core bright energy beam
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#ffffff';
        if (isVertical) {
          const coreW = Math.max(4, laser.width * 0.35);
          ctx.fillRect(laser.x + (laser.width - coreW) / 2, laser.y, coreW, laser.height);
        } else {
          const coreH = Math.max(4, laser.height * 0.35);
          ctx.fillRect(laser.x, laser.y + (laser.height - coreH) / 2, laser.width, coreH);
        }

        // Electric noise sparks
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let s = 0; s < 3; s++) {
          const sparkOffset = Math.sin(time * 0.03 + s * 2) * (laser.width * 0.35);
          const py = laser.y + (laser.height * (s + 1)) / 4;
          ctx.moveTo(laser.x + laser.width / 2 - sparkOffset, py - 4);
          ctx.lineTo(laser.x + laser.width / 2 + sparkOffset, py + 4);
        }
        ctx.stroke();

        // Safe indicator label
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = glowColor;
        ctx.textAlign = 'center';
        ctx.fillText(
          safeRole,
          laser.x + laser.width / 2,
          isVertical ? laser.y - 12 : laser.y - 8
        );
      } else {
        // Deactivated standby line
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(laser.x, laser.y, laser.width, laser.height);
        ctx.setLineDash([]);

        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('OFF', laser.x + laser.width / 2, laser.y - 10);
      }
    }

    ctx.restore();
  }

  private renderVanishingPlatforms(vps: VanishingPlatform[], time: number) {
    const ctx = this.ctx;
    ctx.save();

    for (const vp of vps) {
      if (vp.state === 'invisible') {
        // Phantom outline while vanished
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(vp.x, vp.y, vp.width, vp.height);
        ctx.setLineDash([]);
        continue;
      }

      const isWarning = vp.state === 'warning' || vp.state === 'disappearing';
      const isLocked = vp.state === 'safe_locked';
      let shakeX = 0;
      if (isWarning) {
        // Subtle rapid horizontal tremor when warning
        shakeX = Math.sin(time * 0.04) * 2.5;
      }

      const drawX = vp.x + shakeX;
      const drawY = vp.y;

      // Body
      const bodyColor = isLocked ? '#1e3a8a' : isWarning ? '#78350f' : (vp.color || '#065f46');
      const topColor = isLocked ? '#60a5fa' : isWarning ? '#fbbf24' : (vp.topColor || '#34d399');

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, vp.width, vp.height, 4);
      ctx.fill();

      // Glowing top rune strip
      ctx.fillStyle = topColor;
      ctx.fillRect(drawX, drawY, vp.width, 4);

      // Border with warning pulse
      if (isWarning) {
        const pulse = 0.5 + Math.sin(time * 0.02) * 0.5;
        ctx.strokeStyle = `rgba(251, 191, 36, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, vp.width, vp.height);

        // Warning text indicator
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ DISAPPEARING', drawX + vp.width / 2, drawY - 8);
      } else if (isLocked) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, vp.width, vp.height);

        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#93c5fd';
        ctx.textAlign = 'center';
        ctx.fillText('🔒 SAFE LOCKED', drawX + vp.width / 2, drawY - 8);
      } else {
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(drawX, drawY, vp.width, vp.height);
      }
    }

    ctx.restore();
  }

  private renderGhostPlatforms(gps: GhostPlatform[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const gp of gps) {
      if (!gp.isVisible) {
        // Ethereal dotted phantom silhouette when inactive
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(gp.x, gp.y, gp.width, gp.height);
        ctx.setLineDash([]);
        continue;
      }

      // Active phase-solid state during time freeze
      const pulse = 0.8 + Math.sin(time * 0.015) * 0.2;
      ctx.fillStyle = gp.color || '#064e3b';
      ctx.beginPath();
      ctx.roundRect(gp.x, gp.y, gp.width, gp.height, 4);
      ctx.fill();

      // Glowing temporal edge
      ctx.fillStyle = gp.topColor || '#34d399';
      ctx.fillRect(gp.x, gp.y, gp.width, 4);

      ctx.strokeStyle = `rgba(52, 211, 153, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(gp.x, gp.y, gp.width, gp.height);

      // Ghost icon/rune
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#a7f3d0';
      ctx.textAlign = 'center';
      ctx.fillText('👻 PHASE SOLID', gp.x + gp.width / 2, gp.y - 6);
    }
    ctx.restore();
  }

  private renderWorldPlatforms(wps: WorldPlatform[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const wp of wps) {
      const isActive = wp.isActive !== false;
      const isWorldA = wp.world === 'A';
      const isWorldB = wp.world === 'B';
      const isBoth = wp.world === 'both';

      const baseColor = isWorldA ? '#0284c7' : isWorldB ? '#ea580c' : '#7c3aed';
      const topColor = isWorldA ? '#38bdf8' : isWorldB ? '#fb923c' : '#c084fc';
      const label = isWorldA ? '💧 WORLD A' : isWorldB ? '🔥 WORLD B' : '🌐 WORLD DUAL';

      if (!isActive) {
        // Ghostly inactive outline
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = isWorldA ? 'rgba(56, 189, 248, 0.25)' : 'rgba(251, 146, 60, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(wp.x, wp.y, wp.width, wp.height);
        ctx.setLineDash([]);

        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.textAlign = 'center';
        ctx.fillText(label, wp.x + wp.width / 2, wp.y - 5);
        continue;
      }

      // Active solid platform
      const pulse = 0.85 + Math.sin(time * 0.02) * 0.15;
      ctx.fillStyle = wp.color || (isWorldA ? '#0369a1' : isWorldB ? '#c2410c' : '#5b21b6');
      ctx.beginPath();
      ctx.roundRect(wp.x, wp.y, wp.width, wp.height, 4);
      ctx.fill();

      // Top glowing element bar
      ctx.fillStyle = wp.topColor || topColor;
      ctx.fillRect(wp.x, wp.y, wp.width, 4);

      ctx.strokeStyle = `rgba(${isWorldA ? '56, 189, 248' : isWorldB ? '251, 146, 60' : '192, 132, 252'}, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(wp.x, wp.y, wp.width, wp.height);

      // Label
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(label, wp.x + wp.width / 2, wp.y - 6);
    }
    ctx.restore();
  }

  private renderLaserMirrors(mirrors: LaserMirror[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const m of mirrors) {
      const cx = m.x + m.width / 2;
      const cy = m.y + m.height / 2;

      // Mount base
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 8, cy + 8, 16, 10);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(cx - 8, cy + 8, 16, 10);

      // Rotating mirror prism plate
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((m.angle * Math.PI) / 180);

      // Mirror back plate
      ctx.fillStyle = '#475569';
      ctx.fillRect(-m.width / 2, -4, m.width, 8);

      // Highly reflective silver surface
      const grad = ctx.createLinearGradient(-m.width / 2, 0, m.width / 2, 0);
      grad.addColorStop(0, '#94a3b8');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = grad;
      ctx.fillRect(-m.width / 2 + 2, -2, m.width - 4, 4);

      ctx.restore();

      // Alignment angle indicator
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(`🪞 ${m.angle}°`, cx, m.y - 10);
    }
    ctx.restore();
  }

  private renderLaserReceivers(receivers: LaserReceiver[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const r of receivers) {
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;

      // Sensor casing
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.width, r.height, 4);
      ctx.fill();

      // Border colored by required laser element
      const strokeColor = r.requiredColor === 'red' ? '#ea580c' : '#0284c7';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.width, r.height);

      // Center sensor optical core
      const pulse = r.isHit ? 0.8 + Math.sin(time * 0.02) * 0.2 : 0.4;
      ctx.fillStyle = r.isHit ? (r.requiredColor === 'red' ? '#f87171' : '#38bdf8') : '#475569';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Charge bar if charging
      if (r.charge > 0) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(r.x, r.y - 8, r.width, 4);
        ctx.fillStyle = r.requiredColor === 'red' ? '#fb923c' : '#38bdf8';
        ctx.fillRect(r.x, r.y - 8, (r.width * r.charge) / 100, 4);
      }
    }
    ctx.restore();
  }

  private renderLaserControllers(controllers: LaserDirectionController[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const ctrl of controllers) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(ctrl.x, ctrl.y, ctrl.width, ctrl.height);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ctrl.x, ctrl.y, ctrl.width, ctrl.height);

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(`🔄 ${ctrl.direction.toUpperCase()}`, ctrl.x + ctrl.width / 2, ctrl.y - 4);
    }
    ctx.restore();
  }

  private renderPortalSwitches(switches: PortalDirectionSwitch[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    // Portal switches update their state visually through their associated buttons and conduits
    ctx.restore();
  }

  private renderTeleportAnchors(anchors: TeleportAnchor[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const a of anchors) {
      const cx = a.x + a.width / 2;
      const cy = a.y + a.height / 2;

      // Pedestal glow
      const pulse = 0.7 + Math.sin(time * 0.008) * 0.3;
      ctx.strokeStyle = `rgba(168, 85, 247, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(a.x, a.y, a.width, a.height);

      // Teleport glyph
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌀', cx, cy + 4);
    }
    ctx.restore();
  }

  private renderDistanceWarning(viewWidth: number, time: number) {
    const ctx = this.ctx;
    ctx.save();
    const cx = viewWidth / 2;
    const cy = 60;
    const pulse = 0.8 + Math.sin(time * 0.01) * 0.2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(cx - 180, cy - 20, 360, 40, 20);
    ctx.fill();

    ctx.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠️ 保持靠近！距离过远将限制前行', cx, cy);
    ctx.restore();
  }

  private renderCheckpointBanner(text: string, viewWidth: number, timer: number) {
    const ctx = this.ctx;
    ctx.save();
    const cx = viewWidth / 2;
    const cy = 80;
    const alpha = Math.min(1, timer / 30);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(cx - 210, cy - 24, 420, 48, 24);
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '900 18px sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  private renderDeathBanner(title: string, subtitle: string, viewWidth: number, viewHeight: number) {
    const ctx = this.ctx;
    ctx.save();
    const cx = viewWidth / 2;
    const cy = viewHeight / 2 - 20;

    // Dark vignette
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(cx - 240, cy - 60, 480, 120, 20);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '900 24px sans-serif';
    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, cx, cy - 18);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(subtitle, cx, cy + 22);
    ctx.restore();
  }

  private renderLevelCompleteBanner(width: number, height: number, time: number, levelId?: number) {
    const ctx = this.ctx;
    ctx.save();

    // Backdrop overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2 - 20;

    const isFinalVictory = levelId === 20;
    const bannerW = isFinalVictory ? 620 : 540;
    const bannerH = isFinalVictory ? 180 : 150;

    // Glowing Card
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(cx - bannerW / 2, cy - bannerH / 2, bannerW, bannerH, 24);
    ctx.fill();

    // Dual-color gradient border
    const strokeGrad = ctx.createLinearGradient(cx - bannerW / 2, 0, cx + bannerW / 2, 0);
    strokeGrad.addColorStop(0, '#38bdf8');
    strokeGrad.addColorStop(0.5, '#34d399');
    strokeGrad.addColorStop(1, '#fb923c');
    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Title
    ctx.font = '900 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isFinalVictory ? '#fbbf24' : '#ffffff';
    ctx.fillText(
      isFinalVictory ? '🏆 ALL 20 LEVELS COMPLETED!' : 'LEVEL COMPLETE!',
      cx,
      cy - (isFinalVictory ? 32 : 24)
    );

    // Subtitle
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText(
      isFinalVictory
        ? '👑 恭喜 James & Xinyi 登峰造极！双人终极默契大圆满！'
        : '★ 双人合璧 · 成功通关！准备前往下一关 ★',
      cx,
      cy + (isFinalVictory ? 10 : 16)
    );

    // Minor footer note
    ctx.font = '500 13px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(
      isFinalVictory
        ? '🎉 感谢游玩！所有关卡已解锁，可随时在选关界面体验任意挑战。'
        : '即将进入下一关卡或返回关卡选择...',
      cx,
      cy + (isFinalVictory ? 48 : 46)
    );

    ctx.restore();
  }

  private renderGems(gems: Gem[], time: number) {
    const ctx = this.ctx;

    for (const gem of gems) {
      if (gem.isCollected) continue;

      ctx.save();
      const bob = Math.sin(time * 0.005 + gem.x * 0.02) * 5;
      const cx = gem.x + gem.width / 2;
      const cy = gem.y + gem.height / 2 + bob;
      const w = gem.width || 24;
      const h = gem.height || 28;

      const mainColor = gem.color || (gem.type === 'orange' ? '#fb923c' : gem.type === 'blue' ? '#38bdf8' : '#facc15');
      const glowColor = gem.glowColor || (gem.type === 'orange' ? '#ea580c' : gem.type === 'blue' ? '#0284c7' : '#eab308');

      // Outer pulsating aura
      const pulse = 0.7 + Math.sin(time * 0.008 + gem.x) * 0.25;
      ctx.beginPath();
      ctx.arc(cx, cy, (w / 2) * 1.5 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.globalAlpha = 0.22;
      ctx.fill();

      // Diamond crystal shape
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - h / 2); // Top tip
      ctx.lineTo(cx + w / 2, cy); // Right point
      ctx.lineTo(cx, cy + h / 2); // Bottom point
      ctx.lineTo(cx - w / 2, cy); // Left point
      ctx.closePath();

      const gemGrad = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
      gemGrad.addColorStop(0, '#ffffff');
      gemGrad.addColorStop(0.35, mainColor);
      gemGrad.addColorStop(1, glowColor);

      ctx.fillStyle = gemGrad;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.fill();

      // Inner facet lines for crystalline sparkle
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy - h / 2);
      ctx.lineTo(cx, cy + h / 2);
      ctx.moveTo(cx - w / 2, cy);
      ctx.lineTo(cx + w / 2, cy);
      ctx.stroke();

      // Specular shine point
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(cx - w * 0.18, cy - h * 0.2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Conveyor Belts (Industrial moving treads with animated chevrons)
  private renderConveyorBelts(belts: ConveyorBelt[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const belt of belts) {
      // Base housing
      ctx.fillStyle = belt.color || '#1e293b';
      ctx.beginPath();
      ctx.roundRect(belt.x, belt.y, belt.width, belt.height, 4);
      ctx.fill();
      ctx.strokeStyle = belt.isActive ? '#0284c7' : '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top moving tread surface
      ctx.fillStyle = belt.topColor || '#334155';
      ctx.fillRect(belt.x + 2, belt.y, belt.width - 4, 8);

      // Moving chevron arrows indicating belt movement
      if (belt.isActive) {
        ctx.fillStyle = '#38bdf8';
        const effectiveSpeed = belt.beltDirection === 'LEFT' ? -Math.abs(belt.speed) : (belt.beltDirection === 'RIGHT' ? Math.abs(belt.speed) : belt.speed);
        const offset = ((time * 0.08 * (effectiveSpeed > 0 ? 1 : -1)) % 24 + 24) % 24;
        for (let ax = belt.x + offset; ax < belt.x + belt.width - 12; ax += 24) {
          ctx.beginPath();
          if (effectiveSpeed > 0) {
            ctx.moveTo(ax, belt.y + 2);
            ctx.lineTo(ax + 6, belt.y + 4);
            ctx.lineTo(ax, belt.y + 6);
          } else {
            ctx.moveTo(ax + 6, belt.y + 2);
            ctx.lineTo(ax, belt.y + 4);
            ctx.lineTo(ax + 6, belt.y + 6);
          }
          ctx.fill();
        }
      }

      // Roller wheels
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      for (let rx = belt.x + 16; rx < belt.x + belt.width - 12; rx += 36) {
        const ry = belt.y + belt.height / 2 + 3;
        ctx.beginPath();
        ctx.arc(rx, ry, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Status LED indicator
      ctx.fillStyle = belt.isActive ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(belt.x + 8, belt.y + 14, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Conveyor belt label
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = belt.isActive ? '#38bdf8' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(belt.isActive ? '⚡ CONVEYOR ACTIVE' : 'CONVEYOR STOPPED', belt.x + belt.width / 2, belt.y + belt.height - 4);
    }
    ctx.restore();
  }

  // Talking Terminal (Sci-Fi Communications Station)
  private renderTalkingTerminals(terminals: TalkingTerminal[], time: number) {
    const ctx = this.ctx;
    ctx.save();
    for (const term of terminals) {
      const cx = term.x + term.width / 2;
      const cy = term.y + term.height / 2;

      // Pedestal stand
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 6, term.y + 20, 12, term.height - 20);

      // Terminal screen console
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(term.x, term.y, term.width, 32, 6);
      ctx.fill();

      const isActive = term.isActivated;
      ctx.strokeStyle = isActive ? '#34d399' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Screen glow
      ctx.fillStyle = isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.18)';
      ctx.fillRect(term.x + 3, term.y + 3, term.width - 6, 26);

      // Hologram radar wave pulsing upward
      const pulse = ((time * 0.003) % 1);
      ctx.strokeStyle = isActive ? `rgba(52, 211, 153, ${0.8 * (1 - pulse)})` : `rgba(56, 189, 248, ${0.8 * (1 - pulse)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, term.y, 14 + pulse * 28, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // Message text
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('📢 TERMINAL', cx, term.y - 18);

      if (term.message) {
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = isActive ? '#a7f3d0' : '#bae6fd';
        ctx.fillText(term.message, cx, term.y + 19);
      }
    }
    ctx.restore();
  }

  // Character Dialogue & Interaction Speech Bubbles (Overhead friendly banter)
  private renderDialogueBubbles(
    p1: PlayerState,
    p2: PlayerState,
    prompt: { xinyiText?: string; jamesText?: string },
    time: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    // Xinyi speech bubble
    if (prompt.xinyiText) {
      const bx = p1.x + p1.width / 2;
      const by = p1.y - 42 + Math.sin(time * 0.008) * 3;
      ctx.font = 'bold 12px sans-serif';
      const tw = ctx.measureText(prompt.xinyiText).width;
      const bw = tw + 20;
      const bh = 26;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 8);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tail
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      ctx.moveTo(bx - 4, by + bh / 2);
      ctx.lineTo(bx, by + bh / 2 + 5);
      ctx.lineTo(bx + 4, by + bh / 2);
      ctx.fill();

      ctx.fillStyle = '#e0f2fe';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(prompt.xinyiText, bx, by);
    }

    // James speech bubble
    if (prompt.jamesText) {
      const bx = p2.x + p2.width / 2;
      const by = p2.y - 42 + Math.sin(time * 0.008 + 2) * 3;
      ctx.font = 'bold 12px sans-serif';
      const tw = ctx.measureText(prompt.jamesText).width;
      const bw = tw + 20;
      const bh = 26;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 8);
      ctx.fill();
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tail
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      ctx.moveTo(bx - 4, by + bh / 2);
      ctx.lineTo(bx, by + bh / 2 + 5);
      ctx.lineTo(bx + 4, by + bh / 2);
      ctx.fill();

      ctx.fillStyle = '#ffedd5';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(prompt.jamesText, bx, by);
    }

    ctx.restore();
  }

  // Cooperative System Announcement Banner & Departure Countdown
  private renderSystemBanner(banner: string, countdown: number | undefined, viewWidth: number, time: number) {
    const ctx = this.ctx;
    ctx.save();
    const cx = viewWidth / 2;
    const cy = 60;

    const pulse = Math.sin(time * 0.01) * 2;
    ctx.font = 'bold 15px sans-serif';
    const tw = ctx.measureText(banner).width;
    const bw = Math.max(340, tw + 48);
    const bh = 42;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 14);
    ctx.fill();

    ctx.strokeStyle = countdown ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(banner, cx, cy);

    if (countdown !== undefined && countdown > 0) {
      ctx.font = '900 22px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`⏱️ ${countdown}`, cx + bw / 2 + 35, cy);
    }

    ctx.restore();
  }
}

