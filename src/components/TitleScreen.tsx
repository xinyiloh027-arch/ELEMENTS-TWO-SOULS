import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';
import { soundManager, SoundSettings } from '../services/soundManager';

import skyLandscapeImg from '../assets/images/sky_fantasy_landscape_1793016160491.jpg';
import fullBodyDuoImg from '../assets/images/james_xinyi_fullbody_transparent.png';

interface TitleScreenProps {
  onStartGame: () => void;
}

interface AmbientParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  alpha: number;
  maxAlpha: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  const { t, language } = useLanguage();
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => soundManager.getSettings());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return soundManager.subscribe((settings) => {
      setSoundSettings(settings);
    });
  }, []);

  // Ambient floating glowing light motes (Sky: Children of the Light aesthetic)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = [
      'rgba(254, 240, 138, ', // Golden sunlight mote
      'rgba(186, 230, 253, ', // Sky blue mote
      'rgba(253, 186, 116, ', // Warm flame ember mote
      'rgba(244, 244, 245, ', // Pure celestial white mote
      'rgba(233, 213, 255, ', // Lavender cloud mist
    ];

    const particleCount = Math.min(36, Math.floor(width / 36));
    const particles: AmbientParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.2 + Math.random() * 2.5,
        speedY: -(0.2 + Math.random() * 0.4), // gentle upward float
        speedX: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.8,
        maxAlpha: 0.35 + Math.random() * 0.55,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: 0.015 + Math.random() * 0.02,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        if (!reducedMotion) {
          p.y += p.speedY;
          p.x += p.speedX;
          p.pulsePhase += p.pulseSpeed;

          // Wrap around top/bottom
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        const currentAlpha = p.maxAlpha * (0.6 + Math.sin(p.pulsePhase) * 0.4);

        // Soft radial glow
        const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        glowGrad.addColorStop(0, `${p.color}${currentAlpha})`);
        glowGrad.addColorStop(0.5, `${p.color}${currentAlpha * 0.35})`);
        glowGrad.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Bright particle core
        ctx.fillStyle = `${p.color}${Math.min(1, currentAlpha * 1.3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleStartGameClick = (e: React.MouseEvent) => {
    playUISound('confirm');
    triggerSparkleEffect(e);
    onStartGame();
  };

  const handleSoundToggleClick = (e: React.MouseEvent) => {
    playUISound('toggle');
    triggerSparkleEffect(e);
    soundManager.toggleMute();
    if (soundSettings.muted) {
      soundManager.playJump('xinyi');
    }
  };

  return (
    <div className="relative w-full min-h-screen h-full flex flex-col items-center justify-between overflow-hidden select-none bg-[#0c1a2e] text-white">
      {/* 1. Cinematic Fantasy Landscape Background (Sky: Children of the Light Inspiration) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={skyLandscapeImg}
          alt="Ethereal Mountain and Cloud Realm"
          className="w-full h-full object-cover object-center transform scale-100 will-change-transform"
          loading="eager"
        />

        {/* Volumetric Sunbeam & Light Shimmer Overlay */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70 animate-sunbeam"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 55% 25%, rgba(254, 240, 138, 0.45) 0%, rgba(251, 191, 36, 0.25) 40%, transparent 75%)',
          }}
        />

        {/* Soft Dreamy Gradients: Golden hour sky, gentle mist in valley */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#091424]/90 via-transparent to-[#1e3a8a]/30 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#091424]/95 via-[#091424]/50 to-transparent pointer-events-none" />
      </div>

      {/* 2. Floating Ambient Light Motes Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-1 pointer-events-none w-full h-full"
      />

      {/* 3. Top Header Bar: Language Switcher and Audio Controls */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-3 sm:pt-5 flex items-center justify-between">
        {/* Language Selector in Frosted Glass */}
        <div className="backdrop-blur-md bg-white/20 hover:bg-white/30 rounded-full border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all">
          <LanguageSelector />
        </div>

        {/* Sound Toggle */}
        <button
          id="btn-title-sound-toggle"
          onClick={handleSoundToggleClick}
          title={soundSettings.muted ? 'Unmute' : 'Mute'}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all active:scale-95 cursor-pointer"
        >
          {soundSettings.muted ? (
            <VolumeX className="w-4 h-4 text-rose-300" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-300" />
          )}
          <span className="hidden sm:inline">
            {soundSettings.muted ? t.home.soundMuted : t.home.soundOn}
          </span>
        </button>
      </header>

      {/* 4. Central Hero Experience: TOP TITLE, CENTER FULL-BODY CHARACTERS, BOTTOM START BUTTON */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 flex-1 flex flex-col items-center justify-between py-2 sm:py-4">
        {/* TOP: Game Title & Subtitle */}
        <div className="flex flex-col items-center text-center space-y-1.5 pt-1 sm:pt-2">
          {/* Subtle floating badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full backdrop-blur-md bg-white/20 border border-amber-300/40 shadow-[0_0_20px_rgba(251,191,36,0.3)] text-xs font-bold text-amber-100 tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.titleScreen.duoBadge}</span>
            <span className="text-sky-300 text-xs">✨</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            <span className="text-sky-200 drop-shadow-[0_0_25px_rgba(56,189,248,0.7)]">
              ELEMENTS:
            </span>{' '}
            <span className="text-amber-200 drop-shadow-[0_0_25px_rgba(251,191,36,0.7)]">
              TWO SOULS
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base font-bold tracking-widest text-amber-100/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {t.titleScreen.subtitle}
          </p>
        </div>

        {/* CENTER: JAMES & XINYI — FULL-BODY CHARACTER PRESENTATION (NO CIRCLE, NO CARD, NO AVATAR FRAME) */}
        <div className="relative w-full flex flex-col items-center justify-center my-auto py-1">
          {/* Natural Atmospheric Lighting: Soft cyan water glow on left & warm amber flame glow on right */}
          <div className="absolute -inset-x-8 top-1/4 bottom-1/4 pointer-events-none flex justify-center items-center">
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-sky-400/20 blur-3xl -translate-x-24" />
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-amber-500/20 blur-3xl translate-x-24" />
          </div>

          {/* Full-Body Characters Container with subtle idle floating / breathing */}
          <div className="relative z-10 flex flex-col items-center animate-float-slow">
            {/* The transparent full-body illustration: showing Xinyi and James head to feet */}
            <div className="relative max-w-[340px] sm:max-w-[460px] md:max-w-[540px] max-h-[46vh] sm:max-h-[50vh] flex items-center justify-center">
              <img
                src={fullBodyDuoImg}
                alt="Xinyi and James - Full Body Character Presentation"
                className="w-full h-full object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)] drop-shadow-[0_0_25px_rgba(254,240,138,0.25)] select-none pointer-events-none"
                loading="eager"
              />
            </div>

            {/* Natural Ground Shadow below feet */}
            <div className="w-56 sm:w-80 h-4 sm:h-6 rounded-full bg-slate-950/40 blur-md -mt-2 sm:-mt-3 pointer-events-none" />

            {/* Minimal, elegant character identity labels (no container cards or frames) */}
            <div className="flex items-center justify-between w-full max-w-sm sm:max-w-md px-6 pt-1 text-xs sm:text-sm font-black tracking-wide pointer-events-none">
              <span className="flex items-center gap-1.5 text-sky-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                <span>💧</span>
                <span>{t.titleScreen.p1Name}</span>
              </span>
              <span className="text-[10px] text-amber-200/70 uppercase tracking-widest font-mono">
                ✦ KINDRED ✦
              </span>
              <span className="flex items-center gap-1.5 text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                <span>🔥</span>
                <span>{t.titleScreen.p2Name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM: Prominent START GAME Button */}
        <div className="flex flex-col items-center pb-2 sm:pb-3 w-full">
          <button
            id="btn-title-start-game"
            onClick={handleStartGameClick}
            className="group relative inline-flex items-center justify-center gap-3.5 min-w-[260px] sm:min-w-[320px] h-15 sm:h-17 px-8 sm:px-12 rounded-full backdrop-blur-xl bg-white/90 hover:bg-white text-[#0f172a] border-2 border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.5),0_8px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_0_50px_rgba(251,191,36,0.7),0_12px_32px_rgba(0,0,0,0.4)] transition-all duration-200 active:scale-95 active:translate-y-0.5 cursor-pointer"
          >
            {/* Soft inner glow ring */}
            <span className="absolute inset-0 rounded-full border border-amber-400/50 group-hover:scale-105 transition-transform duration-300 pointer-events-none" />

            <div className="flex flex-col items-center justify-center leading-tight">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-[#0f172a]">
                {t.titleScreen.startGame}
              </span>
              <span className="text-[10px] sm:text-xs font-extrabold tracking-widest text-[#475569] uppercase">
                {t.titleScreen.startGameSub}
              </span>
            </div>

            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 group-hover:translate-x-1.5 transition-transform duration-200 shrink-0" />
          </button>

          {/* Quiet footer subtitle */}
          <p className="text-[11px] sm:text-xs text-sky-100/60 font-medium tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] pt-2.5">
            {language === 'zh'
              ? '水火同行 · 携手探索 20 个奇幻关卡与在线联机冒险'
              : 'Fire & Water Journey · Explore 20 magical co-op levels & online multiplayer'}
          </p>
        </div>
      </main>
    </div>
  );
};
