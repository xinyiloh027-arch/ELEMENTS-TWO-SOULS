import React, { useEffect } from 'react';
import { RotateCcw, Home, Skull } from 'lucide-react';

interface GameOverModalProps {
  currentLevelId: number;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  currentLevelId,
  onRestart,
  onHome,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/60 flex flex-col items-center text-center">
        {/* Skull badge */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-4 shadow-inner">
          <Skull className="w-9 h-9" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-1">
          关卡挑战失败
        </h2>
        <p className="text-sm font-medium text-slate-400 mb-6">
          Level {currentLevelId < 10 ? '0' + currentLevelId : currentLevelId} · 冒险家已耗尽所有生命
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            id="btn-game-over-restart"
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 active:scale-98 text-white font-black text-base shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>重新挑战本关 (Restart)</span>
          </button>

          <button
            id="btn-game-over-home"
            onClick={onHome}
            className="w-full py-3 px-6 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-98 text-slate-300 hover:text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" />
            <span>返回主页 (Home)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
