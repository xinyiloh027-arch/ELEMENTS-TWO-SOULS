import React from 'react';
import { X, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { LEVEL_METADATA_LIST } from '../levels';
import { useLanguage } from '../i18n/LanguageContext';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';

interface LevelSelectModalProps {
  currentLevelId: number;
  unlockedLevel: number;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevelId,
  unlockedLevel,
  onSelectLevel,
  onClose,
}) => {
  const { t, language } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="card-fantasy relative w-full max-w-3xl rounded-3xl p-5 sm:p-7 text-[#1e293b] shadow-2xl flex flex-col max-h-[92vh] border border-white/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0f172a] flex items-center gap-2">
                <span>{t.levelSelect.modalTitle}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0369a1] border border-sky-300">
                  {t.levelSelect.modalBadge}
                </span>
              </h2>
              <p className="text-xs text-[#64748b] font-bold">
                {t.levelSelect.modalSubtitle} {Math.min(unlockedLevel, 20)} / 20
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              playUISound('back');
              triggerSparkleEffect(e);
              onClose();
            }}
            className="btn-fantasy-utility w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5 text-[#475569]" />
          </button>
        </div>

        {/* Level Cards Grid (Levels 1 through 20) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-y-auto py-4 pr-1">
          {LEVEL_METADATA_LIST.map((meta) => {
            const isUnlocked = meta.id <= unlockedLevel;
            const isCurrent = meta.id === currentLevelId;
            const isCompleted = meta.id < unlockedLevel;
            const i18nMeta = t.levels.find((l) => l.id === meta.id) || meta;

            return (
              <div
                key={meta.id}
                onClick={(e) => {
                  if (isUnlocked) {
                    playUISound('click');
                    triggerSparkleEffect(e);
                    onSelectLevel(meta.id);
                  }
                }}
                className={`relative group rounded-2xl p-3.5 border transition-all select-none flex items-center justify-between ${
                  !isUnlocked
                    ? 'bg-slate-100/50 border-slate-200/50 opacity-60 cursor-not-allowed'
                    : isCurrent
                    ? 'bg-sky-100/95 border-2 border-sky-400 shadow-[0_4px_16px_rgba(56,189,248,0.3)] ring-2 ring-sky-300 cursor-pointer'
                    : isCompleted
                    ? 'bg-white/90 hover:bg-emerald-50/90 border-emerald-300/80 shadow-sm hover:shadow-md cursor-pointer active:translate-y-0.5'
                    : 'bg-white/85 hover:bg-white border-slate-200 shadow-sm hover:shadow-md cursor-pointer active:translate-y-0.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Level Number Badge */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                      isUnlocked
                        ? isCurrent
                          ? 'bg-[#0284c7] text-white border-sky-300 shadow-sm'
                          : isCompleted
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-white text-[#1e293b] border-slate-200'
                        : 'bg-slate-200 text-[#94a3b8] border-slate-300'
                    }`}
                  >
                    {isUnlocked ? (
                      meta.id < 10 ? `0${meta.id}` : `${meta.id}`
                    ) : (
                      <Lock className="w-4 h-4 text-[#94a3b8]" />
                    )}
                  </div>

                  {/* Level Info */}
                  <div className="text-left space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-sm tracking-wide ${
                          isCurrent ? 'text-[#0369a1]' : 'text-[#0f172a]'
                        }`}
                      >
                        {i18nMeta.title}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t.levelSelect.completedBadge}
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-sky-200/60 text-[#0369a1] border border-sky-300">
                          {t.levelSelect.currentBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748b] leading-tight">
                      {i18nMeta.desc}
                    </p>
                    <div className="text-[11px] text-amber-700 font-bold pt-0.5">
                      {language === 'zh' ? '难度: ' : 'Difficulty: '}
                      {i18nMeta.difficulty}
                    </div>
                  </div>
                </div>

                {/* Right Action Hint */}
                {isUnlocked && (
                  <div className="text-xs font-bold text-[#0369a1] px-2 py-1 rounded-lg bg-sky-50 border border-sky-200 shadow-2xs group-hover:scale-105 transition-transform">
                    ▶
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
