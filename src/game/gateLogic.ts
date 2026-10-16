import { CoopGate, GateState } from '../types';

export interface GateUpdateInput {
  gate: CoopGate;
  bluePressed: boolean;
  redPressed: boolean;
  deltaMs: number;
}

export interface GateUpdateOutput {
  state: GateState;
  isOpen: boolean;
  openProgress: number;
  isUnlocked: boolean;
  minOpenTimer: number;
  releaseDelayTimer: number;
  uiPrompt: 'DOOR OPEN!' | 'STEP ON BOTH SWITCHES';
}

// Animation duration: 450ms for crisp opening transition
export const GATE_OPEN_DURATION_MS = 450;

/**
 * Authoritative Cooperative Gate Logic
 *
 * Rules:
 * 1. Xinyi (Blue) on Blue Switch + James (Red) on Red Switch:
 *    Both switches triggered simultaneously => Gate unlocks and OPENS.
 * 2. 【Permanent Open Rule】:
 *    Once both switches are activated together, the gate remains PERMANENTLY OPEN.
 *    No closing timers (0s, 1s, 2s, 3s, 5s removed).
 *    Even if players leave switches, jump, move, die or respawn, door remains OPEN.
 * 3. State transition:
 *    LOCKED / CLOSED -> OPENING -> OPEN.
 *    Once OPEN, door will NOT revert to CLOSING or CLOSED.
 */
export function updateGateLogic(input: GateUpdateInput): GateUpdateOutput {
  const { gate, bluePressed, redPressed, deltaMs } = input;
  const bothPressed = bluePressed && redPressed;
  const animStepOpen = deltaMs / GATE_OPEN_DURATION_MS;

  // Check if previously unlocked or triggering now
  let isUnlocked = Boolean(gate.isUnlocked || gate.state === 'OPEN' || bothPressed);
  let state: GateState = gate.state || 'CLOSED';
  let openProgress = typeof gate.openProgress === 'number' ? gate.openProgress : 0;

  if (bothPressed) {
    isUnlocked = true;
  }

  if (isUnlocked) {
    if (state === 'CLOSED' || state === 'CLOSING') {
      state = 'OPENING';
    }

    if (state === 'OPENING') {
      openProgress = Math.min(1.0, openProgress + animStepOpen);
      if (openProgress >= 1.0) {
        openProgress = 1.0;
        state = 'OPEN';
      }
    } else if (state === 'OPEN') {
      openProgress = 1.0;
    }
  } else {
    // Gate has not been unlocked yet and switches are not both active
    if (state !== 'OPEN') {
      state = 'CLOSED';
      openProgress = 0.0;
    }
  }

  const isOpen = isUnlocked || state === 'OPEN' || (state === 'OPENING' && openProgress > 0.1);

  const uiPrompt: 'DOOR OPEN!' | 'STEP ON BOTH SWITCHES' =
    isUnlocked || isOpen ? 'DOOR OPEN!' : 'STEP ON BOTH SWITCHES';

  return {
    state,
    isOpen,
    openProgress,
    isUnlocked,
    minOpenTimer: 0,
    releaseDelayTimer: 0,
    uiPrompt,
  };
}
