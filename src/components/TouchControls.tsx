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
          border: 'border-sky-400/50',
          gradient: 'from-sky-500 to-sky-700 active:from-sky-400 active:to-sky-600',
          jumpGradient: 'from-cyan-400 to-sky-600 active:from-cyan-300 active:to-sky-500',
          text: 'text-sky-400',
          dot: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]',
        }
      : {
          name: t.touch.controllingP2,
          border: 'border-orange-400/50',
          gradient: 'from-orange-500 to-orange-700 active:from-orange-400 active:to-orange-600',
          jumpGradient: 'from-amber-400 to-orange-600 active:from-amber-300 active:to-orange-500',
          text: 'text-orange-400',
          dot: 'bg-orange-400 shadow-[0_0_8px_#fb923c]',
        };

    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-4 px-4 sm:px-8 flex justify-between items-end z-30 select-none touch-none">
        {/* Left Thumb: Directional Controls (Left & Right) */}
        <div className="pointer-events-auto flex flex-col items-start gap-1.5 bg-slate-900/90 backdrop-blur-md p-3 rounded-3xl border shadow-2xl">
          <div className="flex items-center gap-1.5 text-xs font-black px-1 text-slate-300">
            <span className={`w-2.5 h-2.5 rounded-full ${playerTheme.dot}`}></span>
            <span className={playerTheme.text}>{playerTheme.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="touch-online-left"
              {...createButtonHandlers(assignedPlayer, 'left')}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b ${playerTheme.gradient} text-white flex items-center justify-center font-black shadow-lg border active:scale-90 active:translate-y-0.5 transition-transform cursor-pointer`}
              aria-label={t.touch.ariaMoveLeft}
            >
              <ArrowLeft className="w-8 h-8 sm:w-9 sm:h-9" />
            </button>
            <button
              id="touch-online-right"
              {...createButtonHandlers(assignedPlayer, 'right')}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b ${playerTheme.gradient} text-white flex items-center justify-center font-black shadow-lg border active:scale-90 active:translate-y-0.5 transition-transform cursor-pointer`}
              aria-label={t.touch.ariaMoveRight}
            >
              <ArrowRight className="w-8 h-8 sm:w-9 sm:h-9" />
            </button>
          </div>
        </div>

        {/* Right Thumb: Giant Jump Button (Min 64x64) */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 bg-slate-900/90 backdrop-blur-md p-3 rounded-3xl border shadow-2xl">
          <div className="text-xs font-black px-1 text-slate-400">{t.touch.jump} (JUMP)</div>
          <button
            id="touch-online-jump"
            {...createButtonHandlers(assignedPlayer, 'jump')}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b ${playerTheme.jumpGradient} text-white flex flex-col items-center justify-center font-black shadow-xl border-2 active:scale-90 active:translate-y-1 transition-transform cursor-pointer`}
            aria-label={t.touch.ariaJump}
          >
            <ArrowUp className="w-9 h-9 sm:w-10 sm:h-10" />
            <span className="text-xs font-black tracking-wider">JUMP</span>
          </button>
        </div>
      </div>
    );
  }

  // Local 2-Player Co-op mode: dual controllers on single screen
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 px-3 sm:px-6 flex justify-between items-end z-30 select-none touch-none">
      {/* Player 1: Xinyi (Blue) Virtual Controller */}
      <div className="pointer-events-auto flex flex-col items-center gap-2 bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-sky-500/40 shadow-2xl">
        <div className="flex items-center gap-1 text-xs font-black text-sky-400">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]"></span>
          <span>Xinyi (P1)</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            id="touch-xinyi-left"
            {...createButtonHandlers('xinyi', 'left')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-sky-500 to-sky-700 active:from-sky-400 active:to-sky-600 text-white flex items-center justify-center font-black shadow-lg shadow-sky-950/50 border border-sky-400/50 active:scale-90 active:translate-y-0.5 transition-transform cursor-pointer"
            aria-label={`Xinyi ${t.touch.ariaMoveLeft}`}
          >
            <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
          <button
            id="touch-xinyi-jump"
            {...createButtonHandlers('xinyi', 'jump')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-cyan-400 to-sky-600 active:from-cyan-300 active:to-sky-500 text-white flex items-center justify-center font-black shadow-lg shadow-sky-950/50 border border-cyan-300/60 active:scale-90 active:translate-y-0.5 transition-transform cursor-pointer"
            aria-label={`Xinyi ${t.touch.ariaJump}`}
          >
            <ArrowUp className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
          <button
            id="touch-xinyi-right"
            {...createButtonHandlers('xinyi', 'right')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-sky-500 to-sky-700 active:from-sky-400 active:to-sky-600 text-white flex items-center justify-center font-black shadow-lg shadow-sky-950/50 border border-sky-400/50 active:scale-90 active:translate-y-0.5 transition-transform cursor-pointer"
            aria-label={`Xinyi ${t.touch.ariaMoveRight}`}
          >
            <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>

      {/* Player 2: James (Orange) Virtual Controller */}
      <div className="pointer-events-auto flex flex-col items-center gap-2 bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-orange-500/40 shadow-2xl">
        <div className="flex items-center gap-1 text-xs font-black text-orange-400">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_#fb923c]"></span>
          <span>James (P2)</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            id="touch-james-left"
            {...createButtonHandlers('james', 'left')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-orange-500 to-orange-700 active:from-orange-400 active:to-orange-600 text-white flex items-center justify-center font-black shadow-lg shadow-orange-950/50 border border-orange-400/50 active:scale-90 active:translate-y-0.5 transition-transform cursor-pointer"
            aria-label={`James ${t.touch.ariaMoveLeft}`}
          >
            <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
          <button
            id="touch-james-jump"
            {...createButtonHandlers('james', 'jump')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-600 active:from-amber-300 active:to-orange-500 text-white flex items-center justify-center font-black shadow-lg shadow-orange-950/50 border border-amber-300/60 active:scale-90 active:translate-y-0.5 transition-transform cursor-pointer"
            aria-label={`James ${t.touch.ariaJump}`}
          >
            <ArrowUp className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
          <button
            id="touch-james-right"
            {...createButtonHandlers('james', 'right')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-orange-500 to-orange-700 active:from-orange-400 active:to-orange-600 text-white flex items-center justify-center font-black shadow-lg shadow-orange-950/50 border border-orange-400/50 active:scale-90 active:translate-y-0.5 transition-transform cursor-pointer"
            aria-label={`James ${t.touch.ariaMoveRight}`}
          >
            <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};


