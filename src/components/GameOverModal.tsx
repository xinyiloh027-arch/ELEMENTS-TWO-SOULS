import React, { useEffect } from 'react';
import { RotateCcw, Home, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';

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
  const { t } = useLanguage();

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none"
    >
      <div className="card-fantasy relative w-full max-w-md p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Gentle Encouraging Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-500 mb-4 shadow-sm">
          <Sparkles className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">
          {t.gameOver.title}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mb-6">
          {t.gameOver.subtitlePrefix}
          {currentLevelId < 10 ? '0' + currentLevelId : currentLevelId}
          {t.gameOver.subtitleSuffix}
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            id="btn-game-over-restart"
            onClick={(e) => {
              playUISound('click');
              triggerSparkleEffect(e);
              onRestart();
            }}
            className="btn-fantasy-primary w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.gameOver.restartBtn}</span>
          </button>

          <button
            id="btn-game-over-home"
            onClick={(e) => {
              playUISound('back');
              triggerSparkleEffect(e);
              onHome();
            }}
            className="btn-fantasy-utility w-full py-3 px-6 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-600" />
            <span>{t.gameOver.homeBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
