import React from 'react';
import { X, Lock, CheckCircle2, Play, Sparkles } from 'lucide-react';
import { LEVEL_METADATA_LIST } from '../levels';

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-5 sm:p-7 text-white shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-orange-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>LEVEL SELECT</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  关卡选择 (01 ~ 20)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                双人合作平台解谜 · 解锁进度：{Math.min(unlockedLevel, 20)} / 20 关
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto py-4 pr-1">
          {LEVEL_METADATA_LIST.map((meta) => {
            const isUnlocked = meta.id <= unlockedLevel;
            const isCurrent = meta.id === currentLevelId;
            const isCompleted = meta.id < unlockedLevel;

            return (
              <div
                key={meta.id}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectLevel(meta.id);
                  }
                }}
                className={`relative group rounded-2xl p-4 border transition-all select-none flex items-center justify-between ${
                  isUnlocked
                    ? isCurrent
                      ? 'bg-slate-800/95 border-sky-400 shadow-lg shadow-sky-500/10 cursor-pointer ring-2 ring-sky-500/30'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-500 cursor-pointer active:scale-98'
                    : 'bg-slate-900/50 border-slate-800/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Level Number Badge */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shrink-0 border ${
                      isUnlocked
                        ? isCurrent
                          ? 'bg-gradient-to-tr from-sky-500 to-teal-400 text-white border-sky-300 shadow-sm'
                          : 'bg-slate-700 text-slate-200 border-slate-600'
                        : 'bg-slate-800 text-slate-500 border-slate-800'
                    }`}
                  >
                    {isUnlocked ? (
                      meta.id < 10 ? `0${meta.id}` : `${meta.id}`
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  {/* Level Info */}
                  <div className="text-left space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-sm tracking-wide ${
                          isCurrent ? 'text-sky-400' : 'text-slate-200'
                        }`}
                      >
                        {meta.title}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          已通关
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-tight">
                      {meta.desc}
                    </p>
                    <div className="text-[11px] text-amber-400/90 font-medium pt-0.5">
                      难度: {meta.difficulty}
                    </div>
                  </div>
                </div>

                {/* Right Action Icon */}
                <div className="shrink-0 pl-2">
                  {isUnlocked ? (
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600 group-hover:text-white'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-600">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>提示：两名玩家都到达 EXIT 即可解锁下一关。</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer border border-slate-700"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
