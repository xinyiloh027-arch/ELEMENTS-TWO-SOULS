import React, { useEffect, useState } from 'react';
import { Play, Sparkles, Gamepad2, ArrowRight, Users, Grid, Volume2, VolumeX } from 'lucide-react';
import { soundManager, SoundSettings } from '../services/soundManager';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import duoHeroImg from '../assets/images/elements_hero_duo_1792174853275.jpg';
import jamesPortraitImg from '../assets/images/james_fire_boy_1792174873003.jpg';
import xinyiPortraitImg from '../assets/images/xinyi_water_girl_1792174888516.jpg';

interface HomeScreenProps {
  onStartLocalGame: () => void;
  onOpenOnlineLobby: () => void;
  onOpenLevelSelect?: () => void;
  unlockedLevel?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartLocalGame,
  onOpenOnlineLobby,
  onOpenLevelSelect,
  unlockedLevel = 1,
}) => {
  const { t } = useLanguage();
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => soundManager.getSettings());

  useEffect(() => {
    return soundManager.subscribe((settings) => {
      setSoundSettings(settings);
    });
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 text-slate-800 overflow-hidden select-none">
      {/* Top Header Utilities: Art Nouveau Language Selector in top-left */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20">
        <LanguageSelector />
      </div>

      {/* Sound quick toggle button in top-right */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20">
        <button
          id="btn-home-sound-toggle"
          onClick={() => {
            soundManager.toggleMute();
            if (soundSettings.muted) {
              soundManager.playJump('xinyi');
            }
          }}
          title={soundSettings.muted ? 'Unmute' : 'Mute'}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
            soundSettings.muted
              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
              : 'bg-white/90 text-emerald-700 border-emerald-200 hover:bg-white'
          }`}
        >
          {soundSettings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{soundSettings.muted ? t.home.soundMuted : t.home.soundOn}</span>
        </button>
      </div>

      {/* Background soft ambient glowing circles */}
      <div className="absolute top-12 left-1/4 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-80 h-80 rounded-full bg-orange-200/40 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center space-y-7 pt-12 sm:pt-0">
        {/* Title & Lore Header Section */}
        <div className="space-y-3.5 max-w-2xl px-2 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-sky-200 shadow-xs text-xs sm:text-sm font-semibold text-slate-600 tracking-wide backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>{t.home.badge}</span>
          </div>

          {/* 1. Game Title (Primary Hierarchy) */}
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow-xs">
              <span className="text-sky-500 bg-gradient-to-r from-sky-600 to-sky-500 bg-clip-text text-transparent">
                ELEMENTS:
              </span>{' '}
              <span className="text-orange-500 bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                TWO SOULS
              </span>
            </h1>
            <p className="text-xs sm:text-sm font-bold tracking-widest text-slate-500 uppercase">
              {t.home.subLore}
            </p>
          </div>

          {/* 2. English Caption / Tagline (Secondary Hierarchy) */}
          <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight leading-snug">
            {t.home.caption}
          </p>

          {/* 3. Description (Tertiary Hierarchy) */}
          <p className="max-w-xl mx-auto text-sm sm:text-base font-medium text-slate-600 leading-relaxed">
            {t.home.description}
          </p>
        </div>

        {/* Dreamy Duo Illustration Showcase: James & Xinyi */}
        <div className="relative w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white/90 bg-gradient-to-tr from-sky-100 via-white to-amber-100 p-2 sm:p-2.5 transition-all duration-300 hover:shadow-sky-300/40 hover:scale-[1.01] animate-float-slow">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-inner">
            <img
              src={duoHeroImg}
              alt="James & Xinyi - ELEMENTS: TWO SOULS"
              className="w-full h-full object-cover object-center select-none"
              loading="eager"
            />
            {/* Dreamy badges on bottom corners */}
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-slate-900/65 via-slate-900/25 to-transparent flex items-end justify-between text-white text-xs sm:text-sm font-bold">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/85 backdrop-blur-md border border-white/40 shadow-xs">
                💧 Xinyi (Water)
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/85 backdrop-blur-md border border-white/40 shadow-xs">
                🔥 James (Fire)
              </span>
            </div>
          </div>
        </div>

        {/* Character Preview Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {/* Xinyi Card */}
          <div className="flex flex-col items-center p-5 rounded-2xl bg-white/90 border-2 border-sky-200 shadow-sm transition-all hover:shadow-md hover:border-sky-400">
            {/* Cute Xinyi Illustrated Avatar */}
            <div className="relative w-24 h-24 mb-3 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-md border-3 border-sky-400 bg-sky-100 ring-4 ring-sky-100/80 transition-transform hover:scale-105">
                <img
                  src={xinyiPortraitImg}
                  alt="Xinyi - Water Girl"
                  className="w-full h-full object-cover object-top select-none"
                />
              </div>
              <div className="absolute -top-1 px-2.5 py-0.5 rounded-full bg-sky-100 border border-sky-300 text-[11px] font-black text-sky-700 shadow-2xs">
                {t.home.p1Badge}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-lg font-black text-sky-600 mb-1">
              <span>{t.home.p1CardTitle}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3 font-medium">{t.home.p1CardSub}</p>

            {/* Keys */}
            <div className="flex items-center gap-2 pt-2 border-t border-sky-100 w-full justify-center">
              <span className="text-xs font-semibold text-slate-500">{t.home.p1ControlsLabel}</span>
              <div className="flex gap-1.5 text-xs font-mono font-bold text-sky-700">
                <kbd className="px-2 py-1 bg-sky-50 border border-sky-200 rounded-md shadow-2xs">{t.home.p1Keys.left}</kbd>
                <kbd className="px-2 py-1 bg-sky-50 border border-sky-200 rounded-md shadow-2xs">{t.home.p1Keys.right}</kbd>
                <kbd className="px-2 py-1 bg-sky-50 border border-sky-200 rounded-md shadow-2xs">{t.home.p1Keys.jump}</kbd>
              </div>
            </div>
          </div>

          {/* James Card */}
          <div className="flex flex-col items-center p-5 rounded-2xl bg-white/90 border-2 border-orange-200 shadow-sm transition-all hover:shadow-md hover:border-orange-400">
            {/* Cute James Illustrated Avatar */}
            <div className="relative w-24 h-24 mb-3 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-md border-3 border-orange-400 bg-orange-100 ring-4 ring-orange-100/80 transition-transform hover:scale-105">
                <img
                  src={jamesPortraitImg}
                  alt="James - Fire Boy"
                  className="w-full h-full object-cover object-top select-none"
                />
              </div>
              <div className="absolute -top-1 px-2.5 py-0.5 rounded-full bg-orange-100 border border-orange-300 text-[11px] font-black text-orange-700 shadow-2xs">
                {t.home.p2Badge}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-lg font-black text-orange-600 mb-1">
              <span>{t.home.p2CardTitle}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3 font-medium">{t.home.p2CardSub}</p>

            {/* Keys */}
            <div className="flex items-center gap-2 pt-2 border-t border-orange-100 w-full justify-center">
              <span className="text-xs font-semibold text-slate-500">{t.home.p2ControlsLabel}</span>
              <div className="flex gap-1.5 text-xs font-mono font-bold text-orange-700">
                <kbd className="px-2 py-1 bg-orange-50 border border-orange-200 rounded-md shadow-2xs">{t.home.p2Keys.left}</kbd>
                <kbd className="px-2 py-1 bg-orange-50 border border-orange-200 rounded-md shadow-2xs">{t.home.p2Keys.right}</kbd>
                <kbd className="px-2 py-1 bg-orange-50 border border-orange-200 rounded-md shadow-2xs">{t.home.p2Keys.jump}</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Goal Box */}
        <div className="px-5 py-3 rounded-2xl bg-white/80 border border-slate-200/90 text-xs sm:text-sm text-slate-700 flex flex-col sm:flex-row items-center justify-center gap-2 shadow-sm">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Gamepad2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{t.home.coopMechanicTitle}</span>
          </div>
          <span className="text-slate-600">
            {t.home.coopMechanicDesc}
          </span>
        </div>

        {/* Action Buttons: Online Co-op + Local Co-op (Both Large min 56px with clear feedback) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-1">
          {/* Online Multiplayer Button (Highlighted Feature) */}
          <button
            id="btn-online-coop"
            onClick={onOpenOnlineLobby}
            className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto min-w-[240px] h-16 sm:h-18 px-7 py-2 rounded-3xl text-white shadow-xl shadow-indigo-500/25 bg-gradient-to-r from-indigo-600 via-sky-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-200 active:scale-95 cursor-pointer border-2 border-white/40"
          >
            <Users className="w-6 h-6 shrink-0 fill-white/20" />
            <div className="flex flex-col items-center justify-center leading-tight">
              <span className="font-black text-lg sm:text-xl tracking-wide">{t.home.onlineCoop}</span>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wider text-sky-100 uppercase opacity-95">
                {t.home.onlineCoopSub}
              </span>
            </div>
            <span className="text-[11px] bg-white/25 px-2 py-0.5 rounded-full font-bold ml-0.5">{t.home.coopBadge}</span>
          </button>

          {/* Local 2-Player Co-op Button */}
          <button
            id="btn-start-game"
            onClick={onStartLocalGame}
            className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto min-w-[220px] h-16 sm:h-18 px-7 py-2 rounded-3xl text-white shadow-xl shadow-orange-500/25 bg-gradient-to-r from-sky-500 via-amber-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-200 active:scale-95 cursor-pointer border-2 border-white/40"
          >
            <Play className="w-6 h-6 shrink-0 fill-white" />
            <div className="flex flex-col items-center justify-center leading-tight">
              <span className="font-black text-lg sm:text-xl tracking-wide">{t.home.startLevel1}</span>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wider text-amber-100 uppercase opacity-95">
                {t.home.startLevel1Sub}
              </span>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Level Select Option */}
        {onOpenLevelSelect && (
          <button
            id="btn-level-select"
            onClick={onOpenLevelSelect}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300/80 shadow-xs hover:shadow-sm font-bold text-sm tracking-wide transition-all active:scale-95 cursor-pointer"
          >
            <Grid className="w-4 h-4 text-sky-500" />
            <span>{t.home.levelSelect}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
              {t.home.progress}: {unlockedLevel}/20
            </span>
          </button>
        )}

        {/* Subtle footer tip */}
        <p className="text-xs text-slate-400 font-medium">
          {t.home.footerTip}
        </p>
      </div>
    </div>
  );
};

