/**
 * Web Audio API Service
 * Provides simple, responsive, and pleasant UI feedback sounds (clicks, taps, toggles)
 * without external audio file dependencies.
 *
 * Designed to strictly comply with modern browser autoplay policies:
 * - AudioContext is instantiated or resumed only upon direct user interaction.
 * - Handles suspended contexts automatically on click/touch/keydown.
 */

// Singleton AudioContext reference
let audioCtx: AudioContext | null = null;
let isAutoplayUnlocked = false;

/**
 * Lazily initialize or resume the Web Audio Context after user interaction.
 * Complies with browser autoplay policies by ensuring AudioContext is started
 * only during or after user gestures.
 */
export function initAudioOnInteraction(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // Ignored if user gesture requirement not yet satisfied
      });
    }

    isAutoplayUnlocked = true;
    return audioCtx;
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
    return null;
  }
}

// Attach lightweight one-time listeners for general interaction unlock
if (typeof window !== 'undefined') {
  const unlock = () => {
    initAudioOnInteraction();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('pointerdown', unlock, { passive: true, once: true });
  window.addEventListener('keydown', unlock, { passive: true, once: true });
  window.addEventListener('touchstart', unlock, { passive: true, once: true });
}

export type UISoundType = 'click' | 'toggle' | 'confirm' | 'back' | 'sparkle';

/**
 * Check whether sound effects are currently muted in user settings.
 */
function isSoundMuted(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const saved = localStorage.getItem('twinquest_sound_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.muted) return true;
    }
  } catch {
    // Ignore storage parse issues
  }
  return false;
}

/**
 * Plays a short, pleasant click/tap UI sound using Web Audio API synthesis.
 * Safe to call from any button click or tap handler.
 *
 * @param type Style of UI sound ('click', 'toggle', 'confirm', 'back', 'sparkle')
 * @param volume Master gain volume multiplier (default: 0.28)
 */
export function playUISound(
  type: UISoundType = 'click',
  volume: number = 0.28
): void {
  // If the user has muted sound in settings, respect it
  if (isSoundMuted()) return;

  const ctx = initAudioOnInteraction();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    switch (type) {
      case 'toggle': {
        // High-pitched soft switch tick
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.04); // E6

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 0.75, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }

      case 'confirm': {
        // Harmonious rising two-tone pleasant chime
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.04); // G5
        osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 0.8, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

        gain2.gain.setValueAtTime(0.001, now + 0.04);
        gain2.gain.linearRampToValueAtTime(volume * 0.9, now + 0.045);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(ctx.destination);
        gain2.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
        osc2.start(now + 0.04);
        osc2.stop(now + 0.18);
        break;
      }

      case 'back': {
        // Soft descending warm tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.07); // A4

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 0.7, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }

      case 'sparkle': {
        // Delicate high shimmer click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }

      case 'click':
      default: {
        // Short, pleasant, organic click sound with warm attack and soft drop
        // Blends a quick harmonic pitch descent with an instantaneous exponential decay
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5 (pleasing bell-like attack)
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.05); // quick organic drop

        gain.gain.setValueAtTime(0.0001, now);
        // Micro attack (2ms) prevents acoustic pop/click while maintaining crisp tactility
        gain.gain.linearRampToValueAtTime(volume, now + 0.0025);
        // Exponential decay for authentic physical button feel
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }
    }
  } catch (err) {
    console.debug('playUISound audio play error:', err);
  }
}

/**
 * Access the shared AudioContext if initialized.
 */
export function getAudioContext(): AudioContext | null {
  return audioCtx;
}

/**
 * Query whether audio has been initialized by user interaction.
 */
export function isAudioReady(): boolean {
  return isAutoplayUnlocked && audioCtx !== null && audioCtx.state === 'running';
}
