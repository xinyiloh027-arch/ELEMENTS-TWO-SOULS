import React from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const { t } = useLanguage();

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
          <h3 className="text-xl font-bold">{t.help.title}</h3>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          {/* Controls table */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-sky-950/60 border border-sky-500/40">
              <div className="font-bold text-sky-400 mb-2 flex items-center gap-1.5">
                <span>{t.help.p1Header}</span>
              </div>
              <ul className="space-y-1.5 text-xs">
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-sky-300 border border-sky-500/30">A</kbd> {t.help.moveLeft}</li>
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-sky-300 border border-sky-500/30">D</kbd> {t.help.moveRight}</li>
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-sky-300 border border-sky-500/30">W</kbd> {t.help.jump}</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-950/60 border border-orange-500/40">
              <div className="font-bold text-orange-400 mb-2 flex items-center gap-1.5">
                <span>{t.help.p2Header}</span>
              </div>
              <ul className="space-y-1.5 text-xs">
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-orange-300 border border-orange-500/30">←</kbd> {t.help.moveLeft}</li>
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-orange-300 border border-orange-500/30">→</kbd> {t.help.moveRight}</li>
                <li><kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-orange-300 border border-orange-500/30">↑</kbd> {t.help.jump}</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>{t.help.switchesRuleTitle}</strong> {t.help.switchesRuleDesc}</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span><strong>{t.help.exitRuleTitle}</strong> {t.help.exitRuleDesc}</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>{t.help.controlsFeelTitle}</strong> {t.help.controlsFeelDesc}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            id="btn-help-confirm"
            onClick={onClose}
            className="w-full h-13 rounded-2xl font-bold bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white shadow-lg active:scale-98 transition-all cursor-pointer"
          >
            {t.help.confirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
