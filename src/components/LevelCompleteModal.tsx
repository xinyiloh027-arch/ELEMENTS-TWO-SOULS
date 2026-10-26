import React from 'react';
import { Trophy, RotateCcw, Home, Sparkles, ArrowRight, Grid, Award } from 'lucide-react';
import { LEVEL_METADATA_LIST } from '../levels';
import { useLanguage } from '../i18n/LanguageContext';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';

interface LevelCompleteModalProps {
  currentLevelId: number;
  hasNextLevel: boolean;
  autoAdvanceSeconds?: number | null;
  onNextLevel: () => void;
  onSelectLevel: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  currentLevelId,
  hasNextLevel,
  autoAdvanceSeconds = null,
  onNextLevel,
  onSelectLevel,
  onRestart,
  onHome,
}) => {
  const { t, language } = useLanguage();
  const isFinalLevel = currentLevelId === 20;
  const currentMeta = t.levels.find((l) => l.id === currentLevelId) || LEVEL_METADATA_LIST.find((l) => l.id === currentLevelId);
  const nextMeta = t.levels.find((l) => l.id === currentLevelId + 1) || LEVEL_METADATA_LIST.find((l) => l.id === currentLevelId + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 select-none">
      <div className="card-fantasy relative w-full max-w-lg p-6 sm:p-8 text-center text-slate-800">
        {/* Top Trophy Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-500 shadow-sm mb-3">
          {isFinalLevel ? (
            <Award className="w-10 h-10 text-amber-500 animate-bounce" />
          ) : (
            <Trophy className="w-10 h-10 text-amber-500" />
          )}
        </div>

        {/* Level Complete Heading */}
        <div className="space-y-1.5 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isFinalLevel
                ? t.levelComplete.ultimateBadge
                : `${language === 'zh' ? `第 ${currentLevelId} 关` : `Level ${currentLevelId}`} · ${t.levelComplete.normalBadge}`}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 pt-1">
            {isFinalLevel ? t.levelComplete.ultimateHeading : t.levelComplete.normalHeading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {isFinalLevel
              ? t.levelComplete.ultimateMsg
              : `${t.levelComplete.normalMsgPrefix}${currentMeta?.title || `LEVEL ${currentLevelId}`}${t.levelComplete.normalMsgSuffix}`}
          </p>
        </div>

        {/* Team celebration badge */}
        <div className="flex items-center justify-center gap-5 py-2.5 px-6 bg-white/70 rounded-2xl border border-sky-100/80 shadow-xs mb-5">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">💧</span>
            <span className="font-semibold text-sky-700 text-xs sm:text-sm">Xinyi {t.levelComplete.reachedExit}</span>
          </div>
          <div className="text-amber-400 font-bold text-xs">✦</div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🔥</span>
            <span className="font-semibold text-amber-700 text-xs sm:text-sm">James {t.levelComplete.reachedExit}</span>
          </div>
        </div>

        {/* Auto-advance notification */}
        {hasNextLevel && autoAdvanceSeconds !== null && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-sky-50 border border-sky-200/60 flex items-center justify-center gap-2 text-sky-800 text-xs font-semibold animate-pulse">
            <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
            <span>
              {language === 'zh' ? '约 ' : 'About '}
              <strong>{autoAdvanceSeconds}</strong>{' '}
              {t.levelComplete.autoAdvancePrompt}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Next Level Button (Primary Fantasy) */}
          {hasNextLevel && (
            <button
              id="btn-modal-next-level"
              onClick={(e) => {
                playUISound('confirm');
                triggerSparkleEffect(e);
                onNextLevel();
              }}
              className="btn-fantasy-primary w-full h-13 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 cursor-pointer uppercase"
            >
              <span>{t.levelComplete.nextLevelBtn}{nextMeta?.title}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            <button
              id="btn-modal-restart"
              onClick={(e) => {
                playUISound('click');
                triggerSparkleEffect(e);
                onRestart();
              }}
              className="btn-fantasy-utility h-11 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span>{t.levelComplete.replayBtn}</span>
            </button>
            <button
              id="btn-modal-levels"
              onClick={(e) => {
                playUISound('click');
                triggerSparkleEffect(e);
                onSelectLevel();
              }}
              className="btn-fantasy-utility h-11 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Grid className="w-4 h-4 text-sky-600" />
              <span>{t.levelComplete.levelSelectBtn}</span>
            </button>
            <button
              id="btn-modal-home"
              onClick={(e) => {
                playUISound('back');
                triggerSparkleEffect(e);
                onHome();
              }}
              className="btn-fantasy-utility h-11 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-600" />
              <span>{t.levelComplete.homeBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
