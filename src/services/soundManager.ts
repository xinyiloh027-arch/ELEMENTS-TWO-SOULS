// Sound Manager Service using Web Audio API
// Provides procedural background music (BGM) and responsive sound effects (SFX)
// without external audio file dependencies.

export interface SoundSettings {
  muted: boolean;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
}

type SoundListener = (settings: SoundSettings) => void;

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Settings state
  private settings: SoundSettings = {
    muted: false,
    bgmEnabled: true,
    sfxEnabled: true,
    bgmVolume: 0.35,
    sfxVolume: 0.65,
  };

  private listeners: Set<SoundListener> = new Set();

  // BGM Sequencer state
  private isBgmRunning: boolean = false;
  private bgmTimerId: number | null = null;
  private currentStep: number = 0;
  private nextNoteTime: number = 0;
  private activeBgmNodes: AudioNode[] = [];

  // Throttling for rapid sound triggers (e.g. holding button)
  private lastSoundTimes: Map<string, number> = new Map();

  constructor() {
    this.loadSettings();

    // Auto-resume audio context upon user gesture
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.ensureContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });

      // Handle tab visibility to save resources
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
          }
        } else {
          if (this.ctx && this.ctx.state === 'suspended' && !this.settings.muted) {
            this.ctx.resume().catch(() => {});
          }
        }
      });
    }
  }

  private loadSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('twinquest_sound_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = {
          ...this.settings,
          ...parsed,
        };
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('twinquest_sound_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore storage errors
    }
    this.notifyListeners();
  }

  public subscribe(listener: SoundListener): () => void {
    this.listeners.add(listener);
    listener(this.getSettings());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const s = this.getSettings();
    for (const listener of this.listeners) {
      try {
        listener(s);
      } catch (e) {
        console.error('Error in sound listener', e);
      }
    }
  }

  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;

      this.ctx = new AudioCtxClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      // BGM Gain
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.connect(this.masterGain);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);

      this.applyVolumes();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private applyVolumes() {
    if (!this.masterGain || !this.bgmGain || !this.sfxGain || !this.ctx) return;

    const t = this.ctx.currentTime;
    const isMuted = this.settings.muted;

    this.masterGain.gain.setValueAtTime(isMuted ? 0 : 1, t);
    this.bgmGain.gain.setValueAtTime(
      this.settings.bgmEnabled ? Math.max(0, Math.min(1, this.settings.bgmVolume)) : 0,
      t
    );
    this.sfxGain.gain.setValueAtTime(
      this.settings.sfxEnabled ? Math.max(0, Math.min(1, this.settings.sfxVolume)) : 0,
      t
    );
  }

  // ==========================================
  // Public Control APIs
  // ==========================================

  public toggleMute(): boolean {
    this.settings.muted = !this.settings.muted;
    this.applyVolumes();
    this.saveSettings();

    if (!this.settings.muted) {
      this.ensureContext();
      if (!this.isBgmRunning && this.settings.bgmEnabled) {
        this.playBgm();
      }
    }
    return this.settings.muted;
  }

  public setMuted(muted: boolean) {
    this.settings.muted = muted;
    this.applyVolumes();
    this.saveSettings();
  }

  public toggleBgm(): boolean {
    this.settings.bgmEnabled = !this.settings.bgmEnabled;
    this.applyVolumes();
    this.saveSettings();

    if (this.settings.bgmEnabled && !this.isBgmRunning) {
      this.playBgm();
    } else if (!this.settings.bgmEnabled && this.isBgmRunning) {
      this.stopBgm();
    }
    return this.settings.bgmEnabled;
  }

  public setBgmVolume(vol: number) {
    this.settings.bgmVolume = Math.max(0, Math.min(1, vol));
    this.applyVolumes();
    this.saveSettings();
  }

  public toggleSfx(): boolean {
    this.settings.sfxEnabled = !this.settings.sfxEnabled;
    this.applyVolumes();
    this.saveSettings();
    return this.settings.sfxEnabled;
  }

  public setSfxVolume(vol: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, vol));
    this.applyVolumes();
    this.saveSettings();
  }

  // ==========================================
  // SFX: Jump Sounds
  // ==========================================

  public playJump(character: 'xinyi' | 'james' | 'lumi' | 'flare' | string) {
    if (this.settings.muted || !this.settings.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = performance.now();
    const soundKey = `jump-${character}`;
    const lastTime = this.lastSoundTimes.get(soundKey) || 0;
    if (now - lastTime < 90) return; // Prevent double-trigger flutter
    this.lastSoundTimes.set(soundKey, now);

    const isXinyi = character === 'xinyi' || character === 'lumi';

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isXinyi) {
      // Xinyi: Airy, crystalline ascending sweep with bright bell overtone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(680, t + 0.14);

      gain.gain.setValueAtTime(0.32, t);
      gain.gain.linearRampToValueAtTime(0.38, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      // Light harmonic sparkle
      const overtone = ctx.createOscillator();
      const overGain = ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(640, t);
      overtone.frequency.exponentialRampToValueAtTime(1360, t + 0.14);
      overGain.gain.setValueAtTime(0.12, t);
      overGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      overtone.connect(overGain);
      overGain.connect(this.sfxGain);
      overtone.start(t);
      overtone.stop(t + 0.13);
    } else {
      // James: Warm, bouncy spring leap with rich rounded body
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(380, t + 0.15);

      gain.gain.setValueAtTime(0.38, t);
      gain.gain.linearRampToValueAtTime(0.42, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      // Sub-bounce resonance
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(120, t);
      subOsc.frequency.exponentialRampToValueAtTime(240, t + 0.1);
      subGain.gain.setValueAtTime(0.2, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(t);
      subOsc.stop(t + 0.12);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // ==========================================
  // SFX: Interact Sounds
  // ==========================================

  public playInteract(type: 'button' | 'switch' | 'lever' | 'mirror' | 'portal' = 'button') {
    if (this.settings.muted || !this.settings.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = performance.now();
    const soundKey = `interact-${type}`;
    const lastTime = this.lastSoundTimes.get(soundKey) || 0;
    if (now - lastTime < 70) return;
    this.lastSoundTimes.set(soundKey, now);

    const t = ctx.currentTime;

    if (type === 'button' || type === 'switch' || type === 'lever') {
      // Tactile mechanical switch click + subtle resonant body
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(1400, t);
      clickOsc.frequency.exponentialRampToValueAtTime(300, t + 0.035);

      clickGain.gain.setValueAtTime(0.25, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      clickOsc.connect(clickGain);
      clickGain.connect(this.sfxGain);
      clickOsc.start(t);
      clickOsc.stop(t + 0.045);

      // Low mechanical thud
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(180, t);
      thudOsc.frequency.exponentialRampToValueAtTime(65, t + 0.08);

      thudGain.gain.setValueAtTime(0.35, t);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      thudOsc.connect(thudGain);
      thudGain.connect(this.sfxGain);
      thudOsc.start(t);
      thudOsc.stop(t + 0.095);
    } else if (type === 'mirror') {
      // Laser mirror/controller rotate: high-tech servo ratchet
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.setValueAtTime(780, t + 0.03);
      osc.frequency.setValueAtTime(1040, t + 0.06);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.1);
    } else if (type === 'portal') {
      // Portal / Teleport warp whoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.18);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.3);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.33);
    }
  }

  // ==========================================
  // SFX: Gems & Objectives
  // ==========================================

  public playGemCollect() {
    if (this.settings.muted || !this.settings.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;

    // Dual crystal chime: E6 (1318Hz) -> G#6 (1661Hz)
    const tones = [
      { freq: 1318.5, start: 0, dur: 0.22 },
      { freq: 1661.2, start: 0.06, dur: 0.25 },
      { freq: 1975.5, start: 0.12, dur: 0.3 },
    ];

    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + start);

      gain.gain.setValueAtTime(0.2, t + start);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + start);
      osc.stop(t + start + dur);
    });
  }

  public playCheckpoint() {
    if (this.settings.muted || !this.settings.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    // Major triad ascending chime
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.25, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.26);
    });
  }

  public playGateOpen() {
    if (this.settings.muted || !this.settings.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;

    // Resonant stone gate opening drone
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t); // A2

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, t);
    filter.frequency.exponentialRampToValueAtTime(950, t + 0.45);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.62);
  }

  public playPlayerDeath() {
    if (this.settings.muted || !this.settings.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.28);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  public playLevelComplete() {
    if (this.settings.muted || !this.settings.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    // Triumphant 5-note fanfare
    const fanfare = [
      { freq: 523.25, delay: 0, dur: 0.12 }, // C5
      { freq: 659.25, delay: 0.12, dur: 0.12 }, // E5
      { freq: 783.99, delay: 0.24, dur: 0.14 }, // G5
      { freq: 880.0, delay: 0.38, dur: 0.14 }, // A5
      { freq: 1046.5, delay: 0.52, dur: 0.5 }, // C6 (grand sustain)
    ];

    fanfare.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.28, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + delay);
      osc.stop(t + delay + dur + 0.02);
    });
  }

  // ==========================================
  // Procedural Adventure BGM Synthesizer
  // ==========================================

  public playBgm() {
    if (this.isBgmRunning) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.isBgmRunning = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.scheduleBgmLoop();
  }

  public stopBgm() {
    this.isBgmRunning = false;
    if (this.bgmTimerId !== null) {
      window.clearTimeout(this.bgmTimerId);
      this.bgmTimerId = null;
    }

    // Stop and disconnect any active nodes
    for (const node of this.activeBgmNodes) {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
    this.activeBgmNodes = [];
  }

  private scheduleBgmLoop = () => {
    if (!this.isBgmRunning) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.bgmGain) return;

    const scheduleAheadTime = 0.25; // Lookahead window (250ms)
    const stepDuration = 0.13; // ~115 BPM 16th note timing

    while (this.nextNoteTime < ctx.currentTime + scheduleAheadTime) {
      this.playBgmStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 64; // 4-bar loop (16 steps per bar)
    }

    // Schedule next pump
    this.bgmTimerId = window.setTimeout(this.scheduleBgmLoop, 60);
  };

  /**
   * Generates melodic and harmonic elements for each step of the 64-step sequence
   */
  private playBgmStep(step: number, time: number) {
    if (!this.ctx || !this.bgmGain) return;

    // Progression:
    // Bar 0 (0..15):   C Major (C - E - G)
    // Bar 1 (16..31):  G Major (G - B - D)
    // Bar 2 (32..47):  A Minor (A - C - E)
    // Bar 3 (48..63):  F Major (F - A - C)
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // Bass notes (played on beats 0, 4, 8, 12 with syncopation)
    const bassRoots = [130.81, 98.0, 110.0, 87.31]; // C3, G2, A2, F2
    const bassFifth = [196.0, 146.83, 164.81, 130.81]; // G3, D3, E3, C3

    if (stepInBar === 0 || stepInBar === 6 || stepInBar === 10 || stepInBar === 12) {
      const freq = stepInBar === 6 || stepInBar === 12 ? bassFifth[bar] : bassRoots[bar];
      this.playSynthVoice({
        freq,
        time,
        duration: 0.18,
        type: 'triangle',
        volume: 0.24,
        lowpass: 450,
      });
    }

    // Melodic Arpeggio Pentatonic Lead
    // Gentle melodic notes creating an enchanting, upbeat adventure vibe
    const chordTones = [
      [261.63, 329.63, 392.0, 523.25, 659.25], // C: C4, E4, G4, C5, E5
      [196.0, 246.94, 293.66, 392.0, 493.88], // G: G3, B3, D4, G4, B4
      [220.0, 261.63, 329.63, 440.0, 523.25], // Am: A3, C4, E4, A4, C5
      [174.61, 220.0, 261.63, 349.23, 440.0], // F: F3, A3, C4, F4, A4
    ];

    const currentChord = chordTones[bar];
    // Melodic pattern indexed by 16th note step
    const melodyPattern = [0, 2, 1, 3, 2, 4, 3, 1, 0, 1, 2, 3, 4, 3, 2, 1];
    const noteIdx = melodyPattern[stepInBar];
    const noteFreq = currentChord[noteIdx % currentChord.length];

    // Play melody note every 2 steps (8th notes), with occasional syncopated 16th
    if (stepInBar % 2 === 0 || stepInBar === 7 || stepInBar === 15) {
      this.playSynthVoice({
        freq: noteFreq,
        time,
        duration: 0.16,
        type: 'sine',
        volume: 0.16,
        lowpass: 1800,
      });
    }

    // Soft rhythmic hi-hat pulse on 8th offbeats (steps 2, 6, 10, 14)
    if (stepInBar % 4 === 2) {
      this.playHiHatPulse(time);
    }
  }

  private playSynthVoice(opts: {
    freq: number;
    time: number;
    duration: number;
    type: OscillatorType;
    volume: number;
    lowpass?: number;
  }) {
    if (!this.ctx || !this.bgmGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = opts.type;
      osc.frequency.setValueAtTime(opts.freq, opts.time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(opts.lowpass || 1200, opts.time);

      gain.gain.setValueAtTime(0.001, opts.time);
      gain.gain.linearRampToValueAtTime(opts.volume, opts.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, opts.time + opts.duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(opts.time);
      osc.stop(opts.time + opts.duration + 0.02);

      // Store node reference for cleanup
      this.activeBgmNodes.push(osc);
      if (this.activeBgmNodes.length > 30) {
        this.activeBgmNodes.shift();
      }
    } catch {
      // Audio node scheduling guard
    }
  }

  private playHiHatPulse(time: number) {
    if (!this.ctx || !this.bgmGain) return;

    try {
      // High frequency triangle/noise tick
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(3200, time);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4500, time);

      gain.gain.setValueAtTime(0.02, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + 0.035);

      this.activeBgmNodes.push(osc);
      if (this.activeBgmNodes.length > 30) {
        this.activeBgmNodes.shift();
      }
    } catch {
      // Audio node scheduling guard
    }
  }
}

export const soundManager = new SoundManager();
