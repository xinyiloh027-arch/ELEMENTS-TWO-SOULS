import React, { useEffect, useState } from 'react';
import { RotateCcw, Home, Smartphone, Settings, HelpCircle, Users, Grid, Volume2, VolumeX } from 'lucide-react';
import { GameMode, PlayerId, PlayerState } from '../types';
import { soundManager, SoundSettings } from '../services/soundManager';
import { useLanguage } from '../i18n/LanguageContext';

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
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-700/60 px-3 sm:px-6 py-2.5 text-white flex items-center justify-between select-none shadow-md z-20">
      {/* Left: 🔵 Xinyi ❤️❤️❤️ */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border shadow-sm ${
            gameMode === 'online' && isMyRoleP1
              ? 'border-sky-400 ring-2 ring-sky-500/50'
              : 'border-sky-500/40'
          }`}
        >
          <span className="text-base sm:text-lg">🔵</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sky-400 text-xs sm:text-sm tracking-wide">
                Xinyi (P1)
              </span>
              {gameMode === 'online' && isMyRoleP1 && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-sky-500 text-white">
                  {t.header.youBadge}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs tracking-widest text-slate-300">
              {renderHearts(p1?.health ?? 3)}
            </span>
          </div>
          {p1?.isInExit && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse ml-1">
              {t.header.reachedExit}
            </span>
          )}
        </div>
      </div>

      {/* Center: LEVEL SELECT Button & Stats */}
      <div className="flex flex-col items-center gap-1">
        <button
          id="btn-header-level-select"
          onClick={onOpenLevelSelect}
          title={t.header.levelSelectTip}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800/95 hover:bg-slate-700 border border-slate-700 hover:border-amber-400/60 shadow-inner flex items-center gap-2 cursor-pointer transition-all active:scale-95 group"
        >
          <Grid className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
          <span className="font-black text-xs sm:text-sm tracking-wider text-amber-400">
            {displayTitle}
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline group-hover:text-slate-200">
            {t.header.selectLevelPrompt}
          </span>
          {gameMode === 'online' && roomCode && (
            <span className="text-[10px] sm:text-xs font-mono font-bold text-sky-400 border-l border-slate-700 pl-2 flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>#{roomCode}</span>
            </span>
          )}
        </button>

        {/* Lives & Gem Status */}
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
          <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/60">
            <span className="text-red-400">❤️</span>
            <span className="text-slate-200">{lives}/3</span>
          </span>
          {totalGems > 0 && (
            <span className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 text-amber-300">
              <span>💎</span>
              <span>
                {gemsCollected}/{totalGems}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Right: 🟠 James ❤️❤️❤️ + Utility Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={`flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border shadow-sm ${
            gameMode === 'online' && isMyRoleP2
              ? 'border-orange-400 ring-2 ring-orange-500/50'
              : 'border-orange-500/40'
          }`}
        >
          <span className="text-base sm:text-lg">🟠</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-orange-400 text-xs sm:text-sm tracking-wide">
                James (P2)
              </span>
              {gameMode === 'online' && isMyRoleP2 && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-orange-500 text-white">
                  {t.header.youBadge}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs tracking-widest text-slate-300">
              {renderHearts(p2?.health ?? 3)}
            </span>
          </div>
          {p2?.isInExit && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse ml-1">
              {t.header.reachedExit}
            </span>
          )}
        </div>

        {/* Big Action Buttons (Min 48x48px clickable target) */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-700">
          {/* Big Restart Button */}
          <button
            id="btn-restart-level"
            onClick={onRestart}
            title={t.header.restartTip}
            className="h-10 sm:h-12 px-2.5 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 hover:text-amber-200 border border-amber-500/30 flex items-center gap-1 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">{t.header.restartBtn}</span>
          </button>

          {/* Quick Sound Toggle Button */}
          <button
            id="btn-toggle-sound"
            onClick={() => soundManager.toggleMute()}
            title={soundSettings.muted ? t.header.soundMuted : t.header.soundNormal}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              soundSettings.muted
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-slate-800 text-emerald-400 border-slate-700 hover:text-emerald-300 hover:bg-slate-700'
            }`}
          >
            {soundSettings.muted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Big Settings Button */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            title={t.header.settingsTip}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all shadow-sm cursor-pointer"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
          </button>

          {/* Toggle Touch Controls Button */}
          <button
            id="btn-toggle-touch"
            onClick={onToggleTouchControls}
            title={t.header.touchControlsTip}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              showTouchControls
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 shadow-sm shadow-sky-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Help Button */}
          <button
            id="btn-help"
            onClick={onToggleHelp}
            title={t.header.helpTip}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Return Home Button */}
          <button
            id="btn-return-home"
            onClick={onHome}
            title={t.header.homeTip}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};


