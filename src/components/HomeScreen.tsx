import React, { useEffect, useState } from 'react';
import { Play, Gamepad2, ArrowRight, Users, Grid, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { soundManager, SoundSettings } from '../services/soundManager';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

import skyTempleImg from '../assets/images/sky_temple_clouds_1793017137822.jpg';
import jamesPortraitImg from '../assets/images/james_fire_boy_1792174873003.jpg';
import xinyiPortraitImg from '../assets/images/xinyi_water_girl_1792174888516.jpg';

interface HomeScreenProps {
  onStartLocalGame: () => void;
  onOpenOnlineLobby: () => void;
  onOpenLevelSelect?: () => void;
  onReturnToTitle?: () => void;
  unlockedLevel?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartLocalGame,
  onOpenOnlineLobby,
  onOpenLevelSelect,
  onReturnToTitle,
  unlockedLevel = 1,
}) => {
  const { t } = useLanguage();
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => soundManager.getSettings());

  useEffect(() => {
    return soundManager.subscribe((settings) => {
      setSoundSettings(settings);
    });
  }, []);

  const handleStartLocalClick = (e: React.MouseEvent) => {
    playUISound('click');
    triggerSparkleEffect(e);
    onStartLocalGame();
  };

  const handleOpenOnlineClick = (e: React.MouseEvent) => {
    playUISound('click');
    triggerSparkleEffect(e);
    onOpenOnlineLobby();
  };

  const handleOpenLevelSelectClick = (e: React.MouseEvent) => {
    playUISound('click');
    triggerSparkleEffect(e);
    onOpenLevelSelect?.();
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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 text-[#1e293b] overflow-hidden select-none">
      {/* 1. Cinematic Sky Background with Distant Temple & Clouds */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={skyTempleImg}
          alt="Fantasy Sky Mountain Temple"
          className="w-full h-full object-cover object-center transform scale-105 will-change-transform"
          loading="eager"
        />
        {/* Soft dream lighting & mist overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f]/80 via-[#0a192f]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 backdrop-blur-[2px] bg-slate-900/25 pointer-events-none" />
      </div>

      {/* 2. Top Header Utilities: Language Selector, Return to Title, and Sound Toggle */}
      <div className="absolute top-3 sm:top-5 left-3 sm:top-5 left-3 sm:left-6 z-20">
        <div className="backdrop-blur-md bg-white/80 hover:bg-white/95 rounded-full border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all">
          <LanguageSelector />
        </div>
      </div>

      <div className="absolute top-3 sm:top-5 right-3 sm:right-6 z-20 flex items-center gap-2">
        {onReturnToTitle && (
          <button
            id="btn-home-return-title"
            onClick={(e) => {
              playUISound('back');
              triggerSparkleEffect(e);
              onReturnToTitle();
            }}
            title={t.titleScreen.backToTitle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-md bg-white/80 hover:bg-white text-xs font-bold text-[#1e293b] border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all active:scale-95 cursor-pointer"
          >
            <span>🌅</span>
            <span className="hidden sm:inline">{t.titleScreen.backToTitle}</span>
          </button>
        )}
        <button
          id="btn-home-sound-toggle"
          onClick={handleSoundToggleClick}
          title={soundSettings.muted ? 'Unmute' : 'Mute'}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-md text-xs font-bold border transition-all active:scale-95 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.1)] ${
            soundSettings.muted
              ? 'bg-[#fee2e2]/90 text-[#b91c1c] border-rose-300'
              : 'bg-white/80 hover:bg-white text-[#15803d] border-white/60'
          }`}
        >
          {soundSettings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{soundSettings.muted ? t.home.soundMuted : t.home.soundOn}</span>
        </button>
      </div>

      {/* 3. Main Center Content Container */}
      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center space-y-5 pt-12 sm:pt-2">
        {/* Title & Lore Header Section with Soft Fantasy Radiance */}
        <div className="space-y-2 max-w-2xl px-2 animate-fade-in relative">
          {/* Badge: Soft Ethereal Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md bg-white/80 border border-amber-300/60 shadow-[0_2px_12px_rgba(251,191,36,0.25)] text-xs sm:text-sm font-bold text-[#1e293b] tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{t.home.badge}</span>
            <span className="text-sky-400 text-xs">✨</span>
          </div>

          {/* Game Title */}
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              <span className="text-sky-200 drop-shadow-[0_0_20px_rgba(56,189,248,0.7)]">
                ELEMENTS:
              </span>{' '}
              <span className="text-amber-200 drop-shadow-[0_0_20px_rgba(251,191,36,0.7)]">
                TWO SOULS
              </span>
            </h1>
            <p className="text-xs sm:text-sm font-extrabold tracking-widest text-amber-100/90 uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              {t.home.subLore}
            </p>
          </div>

          {/* English Caption / Tagline */}
          <p className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            {t.home.caption}
          </p>

          {/* Description */}
          <p className="max-w-xl mx-auto text-xs sm:text-sm font-medium text-sky-100/90 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
            {t.home.description}
          </p>
        </div>

        {/* Character Introduction Cards (Frosted Fantasy Glass) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {/* Xinyi Card (Water) */}
          <div className="card-fantasy flex flex-col items-center p-4 sm:p-5 rounded-3xl transition-transform duration-200 hover:-translate-y-1">
            {/* Xinyi Avatar */}
            <div className="relative w-20 h-20 mb-2.5 flex items-center justify-center">
              <div className="w-18 h-18 rounded-full overflow-hidden shadow-md border-2 border-sky-300 bg-[#e0f2fe] ring-4 ring-sky-200/50">
                <img
                  src={xinyiPortraitImg}
                  alt="Xinyi - Water Girl"
                  className="w-full h-full object-cover object-top select-none"
                />
              </div>
              <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-[#0284c7] text-[10px] font-black text-white shadow-sm border border-white">
                {t.home.p1Badge}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-base font-black text-[#0369a1] mb-0.5">
              <span>{t.home.p1CardTitle}</span>
            </div>
            <p className="text-xs text-[#475569] mb-2.5 font-medium">{t.home.p1CardSub}</p>

            {/* Keys */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 w-full justify-center">
              <span className="text-xs font-bold text-[#64748b]">{t.home.p1ControlsLabel}</span>
              <div className="flex gap-1 text-xs font-mono font-bold text-[#0369a1]">
                <kbd className="px-2 py-0.5 bg-white/90 border border-sky-300 rounded-lg shadow-xs">{t.home.p1Keys.left}</kbd>
                <kbd className="px-2 py-0.5 bg-white/90 border border-sky-300 rounded-lg shadow-xs">{t.home.p1Keys.right}</kbd>
                <kbd className="px-2 py-0.5 bg-white/90 border border-sky-300 rounded-lg shadow-xs">{t.home.p1Keys.jump}</kbd>
              </div>
            </div>
          </div>

          {/* James Card (Fire) */}
          <div className="card-fantasy flex flex-col items-center p-4 sm:p-5 rounded-3xl transition-transform duration-200 hover:-translate-y-1">
            {/* James Avatar */}
            <div className="relative w-20 h-20 mb-2.5 flex items-center justify-center">
              <div className="w-18 h-18 rounded-full overflow-hidden shadow-md border-2 border-amber-400 bg-[#ffedd5] ring-4 ring-amber-200/50">
                <img
                  src={jamesPortraitImg}
                  alt="James - Fire Boy"
                  className="w-full h-full object-cover object-top select-none"
                />
              </div>
              <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-[#ea580c] text-[10px] font-black text-white shadow-sm border border-white">
                {t.home.p2Badge}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-base font-black text-[#c2410c] mb-0.5">
              <span>{t.home.p2CardTitle}</span>
            </div>
            <p className="text-xs text-[#475569] mb-2.5 font-medium">{t.home.p2CardSub}</p>

            {/* Keys */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 w-full justify-center">
              <span className="text-xs font-bold text-[#64748b]">{t.home.p2ControlsLabel}</span>
              <div className="flex gap-1 text-xs font-mono font-bold text-[#c2410c]">
                <kbd className="px-2 py-0.5 bg-white/90 border border-amber-300 rounded-lg shadow-xs">{t.home.p2Keys.left}</kbd>
                <kbd className="px-2 py-0.5 bg-white/90 border border-amber-300 rounded-lg shadow-xs">{t.home.p2Keys.right}</kbd>
                <kbd className="px-2 py-0.5 bg-white/90 border border-amber-300 rounded-lg shadow-xs">{t.home.p2Keys.jump}</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Goal Box: Frosted Glass Bookmark */}
        <div className="card-fantasy px-5 py-2.5 rounded-2xl text-xs sm:text-sm text-[#1e293b] flex flex-col sm:flex-row items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 font-black text-[#0f172a]">
            <Gamepad2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t.home.coopMechanicTitle}</span>
          </div>
          <span className="text-[#475569] font-medium">
            {t.home.coopMechanicDesc}
          </span>
        </div>

        {/* Action Buttons: Redesigned with Refined Fantasy Sky Aesthetics */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-1">
          {/* Secondary Button: Online Multiplayer (Translucent Sky Blue) */}
          <button
            id="btn-online-coop"
            onClick={handleOpenOnlineClick}
            className="btn-fantasy-secondary group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto min-w-[240px] h-16 sm:h-17 px-7 py-2 rounded-2xl cursor-pointer"
          >
            <Users className="w-6 h-6 shrink-0 text-[#0284c7]" />
            <div className="flex flex-col items-center justify-center leading-tight">
              <span className="font-black text-lg sm:text-xl tracking-wide text-[#0369a1]">{t.home.onlineCoop}</span>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wider text-[#0284c7]/80 uppercase">
                {t.home.onlineCoopSub}
              </span>
            </div>
            <span className="text-[10px] bg-white text-[#0369a1] border border-sky-300 px-2 py-0.5 rounded-full font-bold ml-0.5 shadow-xs">
              {t.home.coopBadge}
            </span>
          </button>

          {/* Primary Button: Local 2-Player Co-op (Radiant Golden Ivory) */}
          <button
            id="btn-start-game"
            onClick={handleStartLocalClick}
            className="btn-fantasy-primary group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto min-w-[220px] h-16 sm:h-17 px-7 py-2 rounded-2xl cursor-pointer"
          >
            <Play className="w-6 h-6 shrink-0 fill-[#1e293b] text-[#1e293b]" />
            <div className="flex flex-col items-center justify-center leading-tight">
              <span className="font-black text-lg sm:text-xl tracking-wide text-[#1e293b]">{t.home.startLevel1}</span>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wider text-[#78350f] uppercase">
                {t.home.startLevel1Sub}
              </span>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1 text-[#1e293b]" />
          </button>
        </div>

        {/* Level Select Option */}
        {onOpenLevelSelect && (
          <button
            id="btn-level-select"
            onClick={handleOpenLevelSelectClick}
            className="btn-fantasy-utility inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm tracking-wide cursor-pointer"
          >
            <Grid className="w-4 h-4 text-sky-600" />
            <span className="text-[#1e293b]">{t.home.levelSelect}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300 font-black">
              {t.home.progress}: {unlockedLevel}/20
            </span>
          </button>
        )}

        {/* Subtle footer tip */}
        <p className="text-xs text-sky-100/80 font-medium pt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {t.home.footerTip}
        </p>
      </div>
    </div>
  );
};
