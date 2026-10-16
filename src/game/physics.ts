import {
  Bridge,
  Checkpoint,
  ConveyorBelt,
  CoopGate,
  ExitZone,
  FallingPlatform,
  HazardZone,
  LaserHazard,
  MovingPlatform,
  Platform,
  PlayerInput,
  PlayerState,
  PushableBox,
  Teleporter,
  VanishingPlatform,
  Vector2D,
  WorldPlatform,
} from '../types';

export const PHYSICS = {
  // Gravity adjustments for crisp, responsive platforming
  GRAVITY_RISE: 0.52,
  GRAVITY_FALL: 0.72,
  GRAVITY_CUT: 0.85, // Extra gravity when releasing jump early (Variable jump)
  MAX_FALL_SPEED: 13.5,

  // Horizontal motion
  MOVE_SPEED: 4.8,
  ACCEL_GROUND: 0.75,
  ACCEL_AIR: 0.45,
  DECEL_GROUND: 0.82,
  DECEL_AIR: 0.94,
  TURN_DECEL: 1.25, // Quick crisp turnaround without icy sliding

  // Jump dynamics
  JUMP_FORCE: -12.2,
  COYOTE_TIME_MAX: 6, // 6 frames leniency after walking off platform
  JUMP_BUFFER_MAX: 6, // 6 frames jump buffer before landing

  // Box physics
  BOX_GRAVITY: 0.65,
  BOX_MAX_FALL: 12.0,
  BOX_PUSH_SPEED: 2.2,
};

export function checkAABB(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

export interface PhysicsUpdateResult {
  player: PlayerState;
  spawnedDust: boolean;
  jumped: boolean;
  landed: boolean;
  tookHazardDamage: boolean;
  died?: boolean;
  activatedCheckpointId?: string;
  teleported?: boolean;
}

export function updatePlayerPhysics(
  player: PlayerState,
  input: PlayerInput,
  platforms: Platform[],
  gate: CoopGate,
  exit: ExitZone,
  levelWidth: number,
  levelHeight: number,
  respawnPoint: Vector2D,
  options?: {
    movingPlatforms?: MovingPlatform[];
    boxes?: PushableBox[];
    bridges?: Bridge[];
    fallingPlatforms?: FallingPlatform[];
    hazards?: HazardZone[];
    checkpoints?: Checkpoint[];
    teleporters?: Teleporter[];
    lasers?: LaserHazard[];
    vanishingPlatforms?: VanishingPlatform[];
    conveyorBelts?: ConveyorBelt[];
    ghostPlatforms?: { id: string; x: number; y: number; width: number; height: number; isVisible: boolean }[];
    worldPlatforms?: WorldPlatform[];
    playerWorld?: 'A' | 'B';
  }
): PhysicsUpdateResult {
  const p = { ...player };
  let spawnedDust = false;
  let jumped = false;
  let landed = false;
  let tookHazardDamage = false;
  let activatedCheckpointId: string | undefined = undefined;
  let teleported = false;
  let died = false;

  const wasGrounded = p.isGrounded;

  // 1. Timers update (Coyote time & Jump buffer)
  if (p.isGrounded) {
    p.coyoteTimer = PHYSICS.COYOTE_TIME_MAX;
  } else if (p.coyoteTimer > 0) {
    p.coyoteTimer--;
  }

  if (input.jump && !p.isGrounded && p.vy > 0) {
    p.jumpBufferTimer = PHYSICS.JUMP_BUFFER_MAX;
  } else if (p.jumpBufferTimer > 0) {
    p.jumpBufferTimer--;
  }

  // 2. Horizontal Acceleration
  const isMovingLeft = input.left && !input.right;
  const isMovingRight = input.right && !input.left;

  if (isMovingLeft) {
    if (p.vx > 0) {
      p.vx -= PHYSICS.TURN_DECEL;
    } else {
      p.vx = Math.max(
        p.vx - (p.isGrounded ? PHYSICS.ACCEL_GROUND : PHYSICS.ACCEL_AIR),
        -PHYSICS.MOVE_SPEED
      );
    }
    p.facing = 'left';
    p.walkFrame += 0.22;
  } else if (isMovingRight) {
    if (p.vx < 0) {
      p.vx += PHYSICS.TURN_DECEL;
    } else {
      p.vx = Math.min(
        p.vx + (p.isGrounded ? PHYSICS.ACCEL_GROUND : PHYSICS.ACCEL_AIR),
        PHYSICS.MOVE_SPEED
      );
    }
    p.facing = 'right';
    p.walkFrame += 0.22;
  } else {
    const decel = p.isGrounded ? PHYSICS.DECEL_GROUND : PHYSICS.DECEL_AIR;
    p.vx *= decel;
    if (Math.abs(p.vx) < 0.08) p.vx = 0;
  }

  // 3. Jump logic
  const canJump = (p.isGrounded || p.coyoteTimer > 0) && p.jumpCount === 0;
  const wantsToJump = input.jump || p.jumpBufferTimer > 0;

  if (wantsToJump && canJump) {
    p.vy = PHYSICS.JUMP_FORCE;
    p.isGrounded = false;
    p.coyoteTimer = 0;
    p.jumpBufferTimer = 0;
    p.jumpCount = 1;
    p.scaleY = 1.28;
    p.scaleX = 0.82;
    jumped = true;
  }

  if (!input.jump && p.isGrounded) {
    p.jumpCount = 0;
  }

  // 4. Gravity application
  let gravity = PHYSICS.GRAVITY_FALL;
  if (p.vy < 0) {
    gravity = input.jump ? PHYSICS.GRAVITY_RISE : PHYSICS.GRAVITY_CUT;
  }
  p.vy += gravity;
  if (p.vy > PHYSICS.MAX_FALL_SPEED) {
    p.vy = PHYSICS.MAX_FALL_SPEED;
  }

  // 5. Gather all dynamic colliders
  const colliders: Platform[] = [...platforms];

  // Bridges (when extended)
  if (options?.bridges) {
    for (const bridge of options.bridges) {
      if (bridge.width > 10) {
        colliders.push({
          id: bridge.id,
          x: bridge.x,
          y: bridge.y,
          width: bridge.width,
          height: bridge.height,
          type: 'platform',
        });
      }
    }
  }

  // Moving Platforms
  if (options?.movingPlatforms) {
    for (const mp of options.movingPlatforms) {
      colliders.push({
        id: mp.id,
        x: mp.x,
        y: mp.y,
        width: mp.width,
        height: mp.height,
        type: 'platform',
      });
    }
  }

  // Falling Platforms (only collide if not in 'falling' off-screen state)
  if (options?.fallingPlatforms) {
    for (const fp of options.fallingPlatforms) {
      if (fp.state !== 'falling') {
        colliders.push({
          id: fp.id,
          x: fp.x,
          y: fp.y,
          width: fp.width,
          height: fp.height,
          type: 'platform',
        });
      }
    }
  }

  // Vanishing Platforms (solid only if in 'safe' or 'warning' state)
  if (options?.vanishingPlatforms) {
    for (const vp of options.vanishingPlatforms) {
      if (vp.state !== 'invisible') {
        colliders.push({
          id: vp.id,
          x: vp.x,
          y: vp.y,
          width: vp.width,
          height: vp.height,
          type: 'platform',
        });
      }
    }
  }

  // Conveyor Belts (Solid Walkable Surface)
  if (options?.conveyorBelts) {
    for (const belt of options.conveyorBelts) {
      colliders.push({
        id: belt.id,
        x: belt.x,
        y: belt.y,
        width: belt.width,
        height: belt.height,
        type: 'platform',
      });
    }
  }

  // Ghost Platforms (solid and walkable only when isVisible is true, e.g. during time freeze)
  if (options?.ghostPlatforms) {
    for (const gp of options.ghostPlatforms) {
      if (gp.isVisible) {
        colliders.push({
          id: gp.id,
          x: gp.x,
          y: gp.y,
          width: gp.width,
          height: gp.height,
          type: 'platform',
        });
      }
    }
  }

  // World Platforms (Level 18, 19, 20: Parallel Worlds)
  if (options?.worldPlatforms) {
    const curWorld = options.playerWorld || 'A';
    for (const wp of options.worldPlatforms) {
      if (wp.isActive !== false && (wp.world === 'both' || wp.world === curWorld)) {
        colliders.push({
          id: wp.id,
          x: wp.x,
          y: wp.y,
          width: wp.width,
          height: wp.height,
          type: 'platform',
        });
      }
    }
  }

  // Gate collision check
  // The gate is strictly impassable until both buttons have been pressed and the gate has opened
  const isGatePassable =
    gate.isOpen ||
    gate.state === 'OPEN' ||
    gate.openProgress >= 0.85;

  if (!isGatePassable) {
    // When the gate is closed, it is an impassable vertical barrier from the ceiling down to the floor
    // This prevents walking through and jumping over the gate before both players press the switches
    colliders.push({
      id: gate.id,
      x: gate.x,
      y: 0,
      width: gate.width,
      height: gate.y + gate.height,
      type: 'pillar',
    });
  }

  // 6. Horizontal Movement and Collision Resolution
  p.x += p.vx;

  // Screen horizontal borders
  if (p.x < 12) {
    p.x = 12;
    p.vx = 0;
  } else if (p.x + p.width > levelWidth - 12) {
    p.x = levelWidth - 12 - p.width;
    p.vx = 0;
  }

  // Horizontal collision with static/moving platforms
  for (const plat of colliders) {
    if (checkAABB(p.x, p.y, p.width, p.height, plat.x, plat.y, plat.width, plat.height)) {
      if (p.vx > 0) {
        p.x = plat.x - p.width;
        p.vx = 0;
      } else if (p.vx < 0) {
        p.x = plat.x + plat.width;
        p.vx = 0;
      }
    }
  }

  // Horizontal Box pushing & blocking
  if (options?.boxes) {
    for (const box of options.boxes) {
      if (checkAABB(p.x, p.y, p.width, p.height, box.x, box.y, box.width, box.height)) {
        // Elemental / role restriction check
        const canPush =
          !box.pushableBy ||
          box.pushableBy === 'both' ||
          (box.pushableBy === 'james' && (p.id === 'james' || (p.id as string) === 'flare')) ||
          (box.pushableBy === 'xinyi' && (p.id === 'xinyi' || (p.id as string) === 'lumi'));

        if (canPush) {
          if (p.vx > 0) {
            // Push right
            box.x += PHYSICS.BOX_PUSH_SPEED;
            box.vx = PHYSICS.BOX_PUSH_SPEED;
            p.x = box.x - p.width;
          } else if (p.vx < 0) {
            // Push left
            box.x -= PHYSICS.BOX_PUSH_SPEED;
            box.vx = -PHYSICS.BOX_PUSH_SPEED;
            p.x = box.x + box.width;
          }
        } else {
          // Block player as solid obstacle
          if (p.vx > 0) {
            p.x = box.x - p.width;
            p.vx = 0;
          } else if (p.vx < 0) {
            p.x = box.x + box.width;
            p.vx = 0;
          }
        }
      }
    }
  }

  // 7. Vertical Movement and Collision Resolution
  p.y += p.vy;
  p.isGrounded = false;

  for (const plat of colliders) {
    if (checkAABB(p.x, p.y, p.width, p.height, plat.x, plat.y, plat.width, plat.height)) {
      if (p.vy > 0) {
        // Landing on surface
        p.y = plat.y - p.height;
        p.vy = 0;
        p.isGrounded = true;

        if (!wasGrounded) {
          p.scaleY = 0.78;
          p.scaleX = 1.25;
          spawnedDust = true;
          landed = true;
        }
      } else if (p.vy < 0) {
        // Hitting ceiling
        p.y = plat.y + plat.height;
        p.vy = 0;
      }
    }
  }

  // Vertical collision with Pushable Boxes (standing on box!)
  if (options?.boxes) {
    for (const box of options.boxes) {
      if (checkAABB(p.x, p.y, p.width, p.height, box.x, box.y, box.width, box.height)) {
        if (p.vy > 0 && p.y + p.height - p.vy <= box.y + 12) {
          // Player lands on top of box!
          p.y = box.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
          if (!wasGrounded) {
            p.scaleY = 0.78;
            p.scaleX = 1.25;
            spawnedDust = true;
            landed = true;
          }
        }
      }
    }
  }

  // Conveyor Belt Grounded Push (Only affects players standing firmly on top!)
  if (options?.conveyorBelts && p.isGrounded) {
    for (const belt of options.conveyorBelts) {
      if (belt.isActive) {
        // Player must be standing on the belt surface: feet exactly near belt.y
        const onTop =
          Math.abs((p.y + p.height) - belt.y) <= 4 &&
          p.x + p.width > belt.x + 2 &&
          p.x < belt.x + belt.width - 2;

        if (onTop) {
          let pushSpeed = belt.speed;
          if (belt.beltDirection === 'LEFT') {
            pushSpeed = -Math.abs(belt.speed);
          } else if (belt.beltDirection === 'RIGHT') {
            pushSpeed = Math.abs(belt.speed);
          }
          p.x += pushSpeed;
          if (p.x < 12) p.x = 12;
          if (p.x + p.width > levelWidth - 12) p.x = levelWidth - 12 - p.width;
        }
      }
    }
  }

  // Trigger vanishing platforms when player stands on them
  if (options?.vanishingPlatforms && p.isGrounded) {
    for (const vp of options.vanishingPlatforms) {
      if (vp.state === 'safe') {
        if (checkAABB(p.x, p.y + p.height - 4, p.width, 8, vp.x, vp.y, vp.width, vp.height)) {
          vp.state = 'warning';
          vp.timer = 0;
        }
      }
    }
  }

  // 8. Hazard Zones Detection (Water, Fire, Spikes)
  if (options?.hazards && p.animationTimer === 0) {
    for (const hz of options.hazards) {
      if (checkAABB(p.x + 4, p.y + 6, p.width - 8, p.height - 6, hz.x, hz.y, hz.width, hz.height)) {
        // Check immunity: water is safe for Xinyi, fire is safe for James
        const isImmune =
          hz.safeFor === p.id ||
          (hz.safeFor === 'xinyi' && (p.id as string) === 'lumi') ||
          (hz.safeFor === 'lumi' && (p.id as string) === 'xinyi') ||
          (hz.safeFor === 'james' && (p.id as string) === 'flare') ||
          (hz.safeFor === 'flare' && (p.id as string) === 'james');
        if (!isImmune) {
          tookHazardDamage = true;
          p.health = Math.max(0, p.health - 1);
          p.animationState = 'hurt';
          p.animationTimer = 35; // Invincibility flicker
          p.vy = -6; // Little pain bounce
          if (p.health <= 0) {
            // Respawn at checkpoint!
            died = true;
            p.x = respawnPoint.x;
            p.y = respawnPoint.y;
            p.health = p.maxHealth;
            p.vx = 0;
            p.vy = 0;
            p.isGrounded = false;
            p.jumpCount = 0;
            p.coyoteTimer = 0;
            p.jumpBufferTimer = 0;
            p.animationState = 'hurt';
            p.animationTimer = 45;
            p.scaleX = 1;
            p.scaleY = 1;
          }
        }
      }
    }
  }

  // 8.5. Laser Hazards Detection
  // Red Laser: safe for James, deadly for Xinyi
  // Blue Laser: safe for Xinyi, deadly for James
  if (options?.lasers) {
    for (const laser of options.lasers) {
      if (!laser.isActive) continue;
      const isSafe =
        (laser.colorType === 'red' && (p.id === 'james' || (p.id as string) === 'flare')) ||
        (laser.colorType === 'blue' && (p.id === 'xinyi' || (p.id as string) === 'lumi'));

      if (isSafe) continue;

      if (checkAABB(p.x, p.y, p.width, p.height, laser.x, laser.y, laser.width, laser.height)) {
        if (p.animationTimer <= 0) {
          p.health = 0;
          tookHazardDamage = true;
          died = true;
          p.x = respawnPoint.x;
          p.y = respawnPoint.y;
          p.health = p.maxHealth;
          p.vx = 0;
          p.vy = 0;
          p.isGrounded = false;
          p.jumpCount = 0;
          p.coyoteTimer = 0;
          p.jumpBufferTimer = 0;
          p.animationState = 'hurt';
          p.animationTimer = 45;
          p.scaleX = 1;
          p.scaleY = 1;
        }
      }
    }
  }

  // 9. Checkpoints Detection
  if (options?.checkpoints) {
    for (const cp of options.checkpoints) {
      if (
        !cp.isActive &&
        checkAABB(p.x, p.y, p.width, p.height, cp.x, cp.y, cp.width, cp.height)
      ) {
        activatedCheckpointId = cp.id;
      }
    }
  }

  // 10. Teleporters Detection
  if (options?.teleporters) {
    for (const tp of options.teleporters) {
      const isEligible = !tp.assignedPlayer || tp.assignedPlayer === p.id;
      const cooldown = p.id === 'xinyi' ? (tp.cooldownP1 ?? 0) : (tp.cooldownP2 ?? 0);
      if (
        isEligible &&
        cooldown <= 0 &&
        checkAABB(p.x, p.y, p.width, p.height, tp.x, tp.y, tp.width, tp.height)
      ) {
        // Warp player to target position
        p.x = tp.targetX;
        p.y = tp.targetY;
        p.vx = 0;
        p.vy = 0;
        p.scaleY = 1.35;
        p.scaleX = 0.75;
        teleported = true;
        if (p.id === 'xinyi') tp.cooldownP1 = 90; // ~1.5s cooldown
        else tp.cooldownP2 = 90;
      }
    }
  }

  // 11. Pit fall-off recovery -> Respawn at Checkpoint
  if (p.y > levelHeight + 30) {
    p.health = Math.max(0, p.health - 1);
    died = true;
    p.x = respawnPoint.x;
    p.y = respawnPoint.y;
    p.health = p.maxHealth;
    p.vx = 0;
    p.vy = 0;
    p.isGrounded = false;
    p.jumpCount = 0;
    p.coyoteTimer = 0;
    p.jumpBufferTimer = 0;
    p.scaleX = 1;
    p.scaleY = 1;
    p.animationState = 'hurt';
    p.animationTimer = 45;
    tookHazardDamage = true;
  }

  // 12. Smooth recovery from squash & stretch
  p.scaleX += (1.0 - p.scaleX) * 0.18;
  p.scaleY += (1.0 - p.scaleY) * 0.18;

  // 13. Update Animation States
  if (p.animationTimer > 0) {
    p.animationTimer--;
    p.animationState = 'hurt';
  } else if (!p.isGrounded) {
    p.animationState = p.vy < -0.5 ? 'jump' : 'fall';
  } else if (Math.abs(p.vx) > 0.4) {
    p.animationState = 'run';
  } else {
    p.animationState = 'idle';
  }

  // 14. Check exit zone overlap
  // Players CANNOT be inside the exit zone or trigger victory until the gate has opened
  const isGateOpenForExit =
    gate.isOpen ||
    gate.state === 'OPEN' ||
    gate.openProgress >= 0.85;

  p.isInExit =
    isGateOpenForExit &&
    checkAABB(
      p.x,
      p.y,
      p.width,
      p.height,
      exit.x,
      exit.y,
      exit.width,
      exit.height
    );

  return {
    player: p,
    spawnedDust,
    jumped,
    landed,
    tookHazardDamage,
    died,
    activatedCheckpointId,
    teleported,
  };
}

export function updateBoxesPhysics(
  boxes: PushableBox[],
  platforms: Platform[],
  levelWidth: number,
  levelHeight: number,
  options?: {
    movingPlatforms?: MovingPlatform[];
    conveyorBelts?: ConveyorBelt[];
    onBoxCollision?: (boxA: PushableBox, boxB: PushableBox) => void;
  }
) {
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];

    // Conveyor belt influence on box
    if (options?.conveyorBelts) {
      for (const belt of options.conveyorBelts) {
        if (belt.isActive && checkAABB(box.x, box.y + box.height - 2, box.width, 6, belt.x, belt.y, belt.width, belt.height)) {
          box.x += belt.speed;
        }
      }
    }

    // Moving platform influence on box
    if (options?.movingPlatforms) {
      for (const mp of options.movingPlatforms) {
        if (checkAABB(box.x, box.y + box.height - 2, box.width, 6, mp.x, mp.y, mp.width, mp.height)) {
          const dx = (mp.endX - mp.startX) * (mp.speed / 100) * mp.direction;
          box.x += dx;
        }
      }
    }

    // 1. Friction on horizontal velocity
    box.vx *= 0.82;
    if (Math.abs(box.vx) < 0.05) box.vx = 0;

    box.x += box.vx;

    // Horizontal bounds
    if (box.x < 12) {
      box.x = 12;
      box.vx = 0;
    } else if (box.x + box.width > levelWidth - 12) {
      box.x = levelWidth - 12 - box.width;
      box.vx = 0;
    }

    // Horizontal platform collision
    for (const plat of platforms) {
      if (checkAABB(box.x, box.y, box.width, box.height, plat.x, plat.y, plat.width, plat.height)) {
        if (box.vx > 0) {
          box.x = plat.x - box.width;
          box.vx = 0;
        } else if (box.vx < 0) {
          box.x = plat.x + plat.width;
          box.vx = 0;
        }
      }
    }

    // 2. Gravity
    box.vy = Math.min(box.vy + PHYSICS.BOX_GRAVITY, PHYSICS.BOX_MAX_FALL);
    box.y += box.vy;
    box.isGrounded = false;

    // Vertical platform collision
    for (const plat of platforms) {
      if (checkAABB(box.x, box.y, box.width, box.height, plat.x, plat.y, plat.width, plat.height)) {
        if (box.vy > 0) {
          box.y = plat.y - box.height;
          box.vy = 0;
          box.isGrounded = true;
        } else if (box.vy < 0) {
          box.y = plat.y + plat.height;
          box.vy = 0;
        }
      }
    }

    // Vertical moving platform collision
    if (options?.movingPlatforms) {
      for (const mp of options.movingPlatforms) {
        if (checkAABB(box.x, box.y, box.width, box.height, mp.x, mp.y, mp.width, mp.height)) {
          if (box.vy >= 0 && box.y + box.height - box.vy <= mp.y + 12) {
            box.y = mp.y - box.height;
            box.vy = 0;
            box.isGrounded = true;
          }
        }
      }
    }

    // Box vs Box collision (Box battle / gentle bounce)
    for (let j = i + 1; j < boxes.length; j++) {
      const other = boxes[j];
      if (checkAABB(box.x, box.y, box.width, box.height, other.x, other.y, other.width, other.height)) {
        options?.onBoxCollision?.(box, other);
        const midA = box.x + box.width / 2;
        const midB = other.x + other.width / 2;
        if (midA < midB) {
          box.x -= 2;
          other.x += 2;
          box.vx = -1.2;
          other.vx = 1.2;
        } else {
          box.x += 2;
          other.x -= 2;
          box.vx = 1.2;
          other.vx = -1.2;
        }
      }
    }

    // Safety: Auto-reset box if dropped into abyss to prevent softlocks!
    if (box.y > levelHeight + 60) {
      box.x = box.spawnX ?? 150;
      box.y = box.spawnY ?? 500;
      box.vx = 0;
      box.vy = 0;
      box.isGrounded = false;
    }
  }
}


