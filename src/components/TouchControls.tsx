import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { GameMode, PlayerId } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface TouchControlsProps {
  onInput: (player: PlayerId, key: 'left' | 'right' | 'jump', isPressed: boolean) => void;
  gameMode?: GameMode;
  assignedPlayer?: PlayerId | 'lumi' | 'flare';
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onInput,
  gameMode = 'local' as GameMode,
  assignedPlayer = 'xinyi' as PlayerId,
}) => {
  const { t } = useLanguage();

  const createButtonHandlers = (player: PlayerId, key: 'left' | 'right' | 'jump') => {
    return {
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        onInput(player, key, true);
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.preventDefault();
        onInput(player, key, false);
      },
      onTouchCancel: (e: React.TouchEvent) => {
        e.preventDefault();
        onInput(player, key, false);
      },
      onMouseDown: (e: React.MouseEvent) => {
        e.preventDefault();
        onInput(player, key, true);
      },
      onMouseUp: (e: React.MouseEvent) => {
        e.preventDefault();
        onInput(player, key, false);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        e.preventDefault();
        onInput(player, key, false);
      },
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
      },
    };
  };

  // Dedicated single-player layout in Online mode: Left/Right on left thumb, large Jump on right thumb!
  if (gameMode === 'online') {
    const isXinyi = assignedPlayer === 'xinyi' || (assignedPlayer as string) === 'lumi';
    const playerTheme = isXinyi
      ? {
          name: t.touch.controllingP1,
          bg: 'bg-gradient-to-t from-sky-500 to-sky-400 active:from-sky-600 active:to-sky-500 text-white shadow-md shadow-sky-500/20',
          jumpBg: 'bg-gradient-to-t from-sky-500 to-teal-400 active:from-sky-600 active:to-teal-500 text-white shadow-md shadow-sky-500/30',
          textColor: 'text-sky-700',
          badge: '💧',
        }
      : {
          name: t.touch.controllingP2,
          bg: 'bg-gradient-to-t from-amber-500 to-orange-400 active:from-amber-600 active:to-orange-500 text-white shadow-md shadow-amber-500/20',
          jumpBg: 'bg-gradient-to-t from-amber-500 to-rose-400 active:from-amber-600 active:to-rose-500 text-white shadow-md shadow-amber-500/30',
          textColor: 'text-amber-700',
          badge: '🔥',
        };

    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-4 px-4 sm:px-8 flex justify-between items-end z-30 select-none touch-none">
        {/* Left Thumb: Directional Controls (Left & Right) */}
        <div className="pointer-events-auto flex flex-col items-start gap-1.5 bg-white/80 backdrop-blur-md p-3 rounded-3xl border border-white/80 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold px-1">
            <span>{playerTheme.badge}</span>
            <span className={playerTheme.textColor}>{playerTheme.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="touch-online-left"
              {...createButtonHandlers(assignedPlayer, 'left')}
              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl ${playerTheme.bg} border border-white/50 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer`}
              aria-label={t.touch.ariaMoveLeft}
            >
              <ArrowLeft className="w-8 h-8" />
            </button>
            <button
              id="touch-online-right"
              {...createButtonHandlers(assignedPlayer, 'right')}
              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl ${playerTheme.bg} border border-white/50 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer`}
              aria-label={t.touch.ariaMoveRight}
            >
              <ArrowRight className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Right Thumb: Giant Jump Button */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 bg-white/80 backdrop-blur-md p-3 rounded-3xl border border-white/80 shadow-lg">
          <div className="text-xs font-semibold px-1 text-slate-500">{t.touch.jump}</div>
          <button
            id="touch-online-jump"
            {...createButtonHandlers(assignedPlayer, 'jump')}
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-3xl ${playerTheme.jumpBg} border border-white/60 flex flex-col items-center justify-center font-bold active:scale-95 transition-all cursor-pointer`}
            aria-label={t.touch.ariaJump}
          >
            <ArrowUp className="w-9 h-9 sm:w-10 sm:h-10" />
            <span className="text-[11px] font-bold tracking-wider uppercase">JUMP</span>
          </button>
        </div>
      </div>
    );
  }

  // Local 2-Player Co-op mode: dual controllers on single screen
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 px-3 sm:px-6 flex justify-between items-end z-30 select-none touch-none">
      {/* Player 1: Xinyi (Blue) Virtual Controller */}
      <div className="pointer-events-auto flex flex-col items-center gap-2 bg-white/85 backdrop-blur-md p-2.5 sm:p-3 rounded-3xl border border-sky-200/80 shadow-lg">
        <div className="flex items-center gap-1 text-xs font-bold text-sky-700">
          <span>💧</span>
          <span>Xinyi (P1)</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            id="touch-xinyi-left"
            {...createButtonHandlers('xinyi', 'left')}
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-t from-sky-500 to-sky-400 active:from-sky-600 active:to-sky-500 text-white border border-sky-300 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
            aria-label={`Xinyi ${t.touch.ariaMoveLeft}`}
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <button
            id="touch-xinyi-jump"
            {...createButtonHandlers('xinyi', 'jump')}
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-t from-amber-400 to-amber-300 active:from-amber-500 active:to-amber-400 text-amber-950 border border-amber-200 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
            aria-label={`Xinyi ${t.touch.ariaJump}`}
          >
            <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <button
            id="touch-xinyi-right"
            {...createButtonHandlers('xinyi', 'right')}
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-t from-sky-500 to-sky-400 active:from-sky-600 active:to-sky-500 text-white border border-sky-300 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
            aria-label={`Xinyi ${t.touch.ariaMoveRight}`}
          >
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>
      </div>

      {/* Player 2: James (Orange) Virtual Controller */}
      <div className="pointer-events-auto flex flex-col items-center gap-2 bg-white/85 backdrop-blur-md p-2.5 sm:p-3 rounded-3xl border border-amber-200/80 shadow-lg">
        <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
          <span>🔥</span>
          <span>James (P2)</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            id="touch-james-left"
            {...createButtonHandlers('james', 'left')}
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-t from-amber-500 to-orange-400 active:from-amber-600 active:to-orange-500 text-white border border-amber-300 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
            aria-label={`James ${t.touch.ariaMoveLeft}`}
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <button
            id="touch-james-jump"
            {...createButtonHandlers('james', 'jump')}
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-t from-amber-400 to-amber-300 active:from-amber-500 active:to-amber-400 text-amber-950 border border-amber-200 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
            aria-label={`James ${t.touch.ariaJump}`}
          >
            <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <button
            id="touch-james-right"
            {...createButtonHandlers('james', 'right')}
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-t from-amber-500 to-orange-400 active:from-amber-600 active:to-orange-500 text-white border border-amber-300 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
            aria-label={`James ${t.touch.ariaMoveRight}`}
          >
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
