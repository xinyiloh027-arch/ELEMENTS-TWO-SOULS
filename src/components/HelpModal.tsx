import React from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-bold">游戏玩法与操作指南</h3>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          {/* Controls table */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-sky-950/60 border border-sky-500/40">
              <div className="font-bold text-sky-400 mb-2 flex items-center gap-1.5">
                <span>🔵 玩家 1 (Xinyi)</span>
              </div>
              <ul className="space-y-1.5 text-xs">
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-sky-300 border border-sky-500/30">A</kbd> 向左移动</li>
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-sky-300 border border-sky-500/30">D</kbd> 向右移动</li>
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-sky-300 border border-sky-500/30">W</kbd> 跳跃</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-950/60 border border-orange-500/40">
              <div className="font-bold text-orange-400 mb-2 flex items-center gap-1.5">
                <span>🟠 玩家 2 (James)</span>
              </div>
              <ul className="space-y-1.5 text-xs">
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-orange-300 border border-orange-500/30">←</kbd> 向左移动</li>
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-orange-300 border border-orange-500/30">→</kbd> 向右移动</li>
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-orange-300 border border-orange-500/30">↑</kbd> 跳跃</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>双人合作踏板：</strong>地图中有蓝色踏板（Xinyi）和橙色踏板（James），两人必须<strong>同时踩下</strong>各自的踏板，通往高处的大门才会打开！</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span><strong>双人终点：</strong>两人都进入终点传送门才可通关；一人先到会显示“等待队友”。</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>手感优化：</strong>已加入物理惯性、空中平滑微调、土狼时间（边缘起跳容错）与落地缓冲。</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            id="btn-help-confirm"
            onClick={onClose}
            className="w-full h-13 rounded-2xl font-bold bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white shadow-lg active:scale-98 transition-all cursor-pointer"
          >
            明白了，开始闯关
          </button>
        </div>
      </div>
    </div>
  );
};
