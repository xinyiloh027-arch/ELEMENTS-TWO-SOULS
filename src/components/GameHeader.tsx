import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Home,
  Smartphone,
  Settings,
  HelpCircle,
  Users,
  Grid,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameMode, PlayerId, PlayerState } from '../types';
import { soundManager, SoundSettings } from '../services/soundManager';
import { useLanguage } from '../i18n/LanguageContext';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';

interface GameHeaderProps {
  xinyi?: PlayerState | null;
  james?: PlayerState | null;
  lumi?: PlayerState | null;
  flare?: PlayerState | null;
  levelTitle: string;
  currentLevelId?: number;
  gameMode?: GameMode;
  onlineRole?: PlayerId | 'lumi' | 'flare';
  roomCode?: string;
  lives?: number;
  gemsCollected?: number;
  totalGems?: number;
  onRestart: () => void;
  onHome: () => void;
  onOpenLevelSelect?: () => void;
  showTouchControls: boolean;
  onToggleTouchControls: () => void;
  onToggleHelp: () => void;
  onOpenSettings: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  xinyi,
  james,
  lumi,
  flare,
  levelTitle,
  currentLevelId,
  gameMode = 'local' as GameMode,
  onlineRole = 'xinyi' as PlayerId,
  roomCode,
  lives = 3,
  gemsCollected = 0,
  totalGems = 0,
  onRestart,
  onHome,
  onOpenLevelSelect,
  showTouchControls,
  onToggleTouchControls,
  onToggleHelp,
  onOpenSettings,
}) => {
  const { t } = useLanguage();
  const p1 = xinyi || lumi;
  const p2 = james || flare;

  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => soundManager.getSettings());

  useEffect(() => {
    return soundManager.subscribe((settings) => {
      setSoundSettings(settings);
    });
  }, []);

  const renderHearts = (health: number = 3) => {
    return '❤️'.repeat(Math.max(0, health));
  };

  const isMyRoleP1 = onlineRole === 'xinyi' || (onlineRole as string) === 'lumi';
  const isMyRoleP2 = onlineRole === 'james' || (onlineRole as string) === 'flare';

  // Dynamic localized level title
  const activeLevelMeta = currentLevelId ? t.levels.find((l) => l.id === currentLevelId) : null;
  const displayTitle = activeLevelMeta ? activeLevelMeta.title : levelTitle;

  return (
    <header className="w-full bg-white/85 backdrop-blur-md border-b border-sky-200/50 px-3 sm:px-6 py-2 text-slate-800 flex items-center justify-between select-none shadow-xs z-20">
      {/* Left: 💧 Xinyi (P1) Card */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={`flex items-center gap-2 bg-sky-50/90 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-sky-200/80 shadow-xs ${
            gameMode === 'online' && isMyRoleP1
              ? 'ring-2 ring-sky-400'
              : ''
          }`}
        >
          <span className="text-base sm:text-lg">💧</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sky-800 text-xs sm:text-sm tracking-wide">
                Xinyi (P1)
              </span>
              {gameMode === 'online' && isMyRoleP1 && (
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-sky-500 text-white">
                  {t.header.youBadge}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs tracking-widest text-red-500">
              {renderHearts(p1?.health ?? 3)}
            </span>
          </div>
          {p1?.isInExit && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-bounce ml-1">
              {t.header.reachedExit}
            </span>
          )}
        </div>
      </div>

      {/* Center: LEVEL SELECT Button & Stats */}
      <div className="flex flex-col items-center gap-1">
        <button
          id="btn-header-level-select"
          onClick={(e) => {
            playUISound('click');
            triggerSparkleEffect(e);
            onOpenLevelSelect?.();
          }}
          title={t.header.levelSelectTip}
          className="btn-fantasy-utility px-3.5 py-1.5 rounded-2xl flex items-center gap-2 cursor-pointer group"
        >
          <Grid className="w-3.5 h-3.5 text-sky-500 group-hover:rotate-45 transition-transform" />
          <span className="font-bold text-xs sm:text-sm tracking-wide text-slate-800">
            {displayTitle}
          </span>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
            {t.header.selectLevelPrompt}
          </span>
          {gameMode === 'online' && roomCode && (
            <span className="text-[10px] sm:text-xs font-mono font-semibold text-sky-700 border-l border-slate-200 pl-2 flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-600" />
              <span>#{roomCode}</span>
            </span>
          )}
        </button>

        {/* Lives & Gem Status */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
          <span className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-xl border border-sky-100 shadow-xs">
            <span>❤️</span>
            <span className="font-bold text-red-500">{lives}/3</span>
          </span>
          {totalGems > 0 && (
            <span className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-xl border border-sky-100 shadow-xs text-amber-600">
              <span>💎</span>
              <span className="font-bold">
                {gemsCollected}/{totalGems}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Right: 🔥 James (P2) Card + Cute Utility Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={`flex items-center gap-2 bg-amber-50/90 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-amber-200/80 shadow-xs ${
            gameMode === 'online' && isMyRoleP2
              ? 'ring-2 ring-amber-400'
              : ''
          }`}
        >
          <span className="text-base sm:text-lg">🔥</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-amber-800 text-xs sm:text-sm tracking-wide">
                James (P2)
              </span>
              {gameMode === 'online' && isMyRoleP2 && (
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                  {t.header.youBadge}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs tracking-widest text-red-500">
              {renderHearts(p2?.health ?? 3)}
            </span>
          </div>
          {p2?.isInExit && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-bounce ml-1">
              {t.header.reachedExit}
            </span>
          )}
        </div>

        {/* Fantasy Utility Buttons (Min 40x40 touch target) */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-sky-200/50">
          {/* Restart Level Button */}
          <button
            id="btn-restart-level"
            onClick={(e) => {
              playUISound('click');
              triggerSparkleEffect(e);
              onRestart();
            }}
            title={t.header.restartTip}
            className="btn-fantasy-utility h-10 sm:h-11 px-2.5 sm:px-3 rounded-2xl flex items-center gap-1 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline text-slate-700">{t.header.restartBtn}</span>
          </button>

          {/* Quick Sound Toggle Button */}
          <button
            id="btn-toggle-sound"
            onClick={(e) => {
              playUISound('toggle');
              triggerSparkleEffect(e);
              soundManager.toggleMute();
            }}
            title={soundSettings.muted ? t.header.soundMuted : t.header.soundNormal}
            className={`btn-fantasy-utility w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center cursor-pointer ${
              soundSettings.muted
                ? 'bg-red-50 text-red-500'
                : 'text-emerald-700'
            }`}
          >
            {soundSettings.muted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Settings Button */}
          <button
            id="btn-open-settings"
            onClick={(e) => {
              playUISound('click');
              triggerSparkleEffect(e);
              onOpenSettings();
            }}
            title={t.header.settingsTip}
            className="btn-fantasy-utility w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center cursor-pointer text-slate-600"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Toggle Touch Controls Button */}
          <button
            id="btn-toggle-touch"
            onClick={(e) => {
              playUISound('toggle');
              triggerSparkleEffect(e);
              onToggleTouchControls();
            }}
            title={t.header.touchControlsTip}
            className={`btn-fantasy-utility w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center cursor-pointer ${
              showTouchControls
                ? 'bg-sky-100 text-sky-800 ring-1 ring-sky-300'
                : 'text-slate-600'
            }`}
          >
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Help Button */}
          <button
            id="btn-help"
            onClick={(e) => {
              playUISound('click');
              triggerSparkleEffect(e);
              onToggleHelp();
            }}
            title={t.header.helpTip}
            className="btn-fantasy-utility w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center cursor-pointer text-slate-600"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Return Home Button */}
          <button
            id="btn-return-home"
            onClick={(e) => {
              playUISound('back');
              triggerSparkleEffect(e);
              onHome();
            }}
            title={t.header.homeTip}
            className="btn-fantasy-utility w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center cursor-pointer text-slate-600"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
