import React from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="card-fantasy relative w-full max-w-md p-6 sm:p-7 text-slate-800">
        {/* Close Button */}
        <button
          id="btn-help-close"
          onClick={(e) => {
            playUISound('back');
            triggerSparkleEffect(e);
            onClose();
          }}
          className="btn-fantasy-utility absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-sky-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-800">{t.help.title}</h3>
            <p className="text-xs text-sky-600 font-semibold tracking-wide">ELEMENTS: TWO SOULS</p>
          </div>
        </div>

        <div className="space-y-3.5 text-sm">
          {/* Controls Table */}
          <div className="grid grid-cols-2 gap-3">
            {/* P1 Controls */}
            <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/60 shadow-xs">
              <div className="font-bold text-sky-700 mb-2 flex items-center gap-1.5 text-xs">
                <span>💧</span>
                <span>{t.help.p1Header}</span>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-700">
                <li className="flex items-center justify-between">
                  <span>{t.help.moveLeft}</span>
                  <kbd className="px-2 py-0.5 bg-white rounded-md font-mono text-sky-700 border border-sky-200 shadow-xs">A</kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span>{t.help.moveRight}</span>
                  <kbd className="px-2 py-0.5 bg-white rounded-md font-mono text-sky-700 border border-sky-200 shadow-xs">D</kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span>{t.help.jump}</span>
                  <kbd className="px-2 py-0.5 bg-white rounded-md font-mono text-sky-700 border border-sky-200 shadow-xs">W</kbd>
                </li>
              </ul>
            </div>

            {/* P2 Controls */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 shadow-xs">
              <div className="font-bold text-amber-700 mb-2 flex items-center gap-1.5 text-xs">
                <span>🔥</span>
                <span>{t.help.p2Header}</span>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-700">
                <li className="flex items-center justify-between">
                  <span>{t.help.moveLeft}</span>
                  <kbd className="px-2 py-0.5 bg-white rounded-md font-mono text-amber-700 border border-amber-200 shadow-xs">←</kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span>{t.help.moveRight}</span>
                  <kbd className="px-2 py-0.5 bg-white rounded-md font-mono text-amber-700 border border-amber-200 shadow-xs">→</kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span>{t.help.jump}</span>
                  <kbd className="px-2 py-0.5 bg-white rounded-md font-mono text-amber-700 border border-amber-200 shadow-xs">↑</kbd>
                </li>
              </ul>
            </div>
          </div>

          {/* Gameplay Rules Note */}
          <div className="p-3.5 rounded-2xl bg-white/70 border border-sky-100/80 shadow-xs space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-800">{t.help.switchesRuleTitle}</strong>{' '}
                <span className="text-slate-600">{t.help.switchesRuleDesc}</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-800">{t.help.exitRuleTitle}</strong>{' '}
                <span className="text-slate-600">{t.help.exitRuleDesc}</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-800">{t.help.controlsFeelTitle}</strong>{' '}
                <span className="text-slate-600">{t.help.controlsFeelDesc}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mt-5">
          <button
            id="btn-help-confirm"
            onClick={(e) => {
              playUISound('confirm');
              triggerSparkleEffect(e);
              onClose();
            }}
            className="btn-fantasy-primary w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.help.confirmBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
