import React from 'react';
import { Trophy, RotateCcw, Home, Sparkles, ArrowRight, Grid, Award } from 'lucide-react';
import { LEVEL_METADATA_LIST } from '../levels';

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
  const isFinalLevel = currentLevelId === 20;
  const currentMeta = LEVEL_METADATA_LIST.find((l) => l.id === currentLevelId);
  const nextMeta = LEVEL_METADATA_LIST.find((l) => l.id === currentLevelId + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl shadow-emerald-500/20">
        {/* Glow behind trophy */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-emerald-500/25 blur-2xl pointer-events-none" />

        {/* Top Trophy Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-400 text-white shadow-xl shadow-emerald-600/40 mb-4 ring-4 ring-slate-900">
          {isFinalLevel ? (
            <Award className="w-10 h-10 text-amber-200 animate-bounce" />
          ) : (
            <Trophy className="w-10 h-10 text-amber-200" />
          )}
        </div>

        {/* Level Complete Heading */}
        <div className="space-y-1.5 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isFinalLevel
                ? '终极通关 · 合作大师'
                : `第 ${currentLevelId} 关 · 双人协力达成`}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white pt-1">
            {isFinalLevel ? 'ALL 20 LEVELS COMPLETE!' : 'LEVEL COMPLETE!'}
          </h2>
          <p className="text-sm text-slate-300">
            {isFinalLevel
              ? '🎉 绝妙默契！Xinyi 与 James 成功征服了全部 20 个双人合作神殿关卡！'
              : `太棒了！顺利通关「${currentMeta?.title || `LEVEL ${currentLevelId}`}」！`}
          </p>
        </div>

        {/* Team celebration badge */}
        <div className="flex items-center justify-center gap-6 py-3 px-6 bg-slate-800/80 rounded-2xl border border-slate-700/80 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔵</span>
            <span className="font-bold text-sky-400 text-sm">Xinyi (到达终点)</span>
          </div>
          <div className="text-slate-500 font-bold text-sm">+</div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🟠</span>
            <span className="font-bold text-orange-400 text-sm">James (到达终点)</span>
          </div>
        </div>

        {/* Auto-advance notification */}
        {hasNextLevel && autoAdvanceSeconds !== null && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-300 text-sm font-medium animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>约 <strong>{autoAdvanceSeconds}</strong> 秒后自动进入下一关...</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Next Level Button (if available) */}
          {hasNextLevel && (
            <button
              id="btn-modal-next-level"
              onClick={onNextLevel}
              className="w-full h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white shadow-lg shadow-emerald-500/30 border border-white/25 active:scale-98 transition-all cursor-pointer"
            >
              <span>进入下一关: {nextMeta?.title}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            <button
              id="btn-modal-restart"
              onClick={onRestart}
              className="h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重玩本关</span>
            </button>
            <button
              id="btn-modal-levels"
              onClick={onSelectLevel}
              className="h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <Grid className="w-4 h-4" />
              <span>关卡选择</span>
            </button>
            <button
              id="btn-modal-home"
              onClick={onHome}
              className="h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>主页</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
