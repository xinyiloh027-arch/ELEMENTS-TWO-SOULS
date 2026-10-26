import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  compact = false,
}) => {
  const { language, setLanguage, t } = useLanguage();

  const handleSelect = (lang: 'zh' | 'en', e: React.MouseEvent) => {
    playUISound('toggle');
    triggerSparkleEffect(e);
    setLanguage(lang);
  };

  return (
    <div
      className={`relative inline-flex items-center select-none ${className}`}
      role="group"
      aria-label={t.selectorLabel}
    >
      {/* Frosted Glass Fantasy Container */}
      <div className="relative flex items-center gap-1.5 p-1 sm:p-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/70 shadow-sm text-slate-700">
        {/* Globe Icon & Title Tag */}
        <div className="flex items-center gap-1 pl-2 pr-1 text-xs font-semibold text-slate-700">
          <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span className="tracking-wide text-[11px] whitespace-nowrap">
            {language === 'zh' ? '语言' : 'Language'}
          </span>
        </div>

        {/* Chinese Button */}
        <button
          type="button"
          id="btn-lang-zh"
          onClick={(e) => handleSelect('zh', e)}
          aria-pressed={language === 'zh'}
          title="切换至中文 (Switch to Chinese)"
          className={`relative px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
            language === 'zh'
              ? 'bg-gradient-to-r from-sky-400 to-teal-400 text-white shadow-sm ring-1 ring-sky-300/60'
              : 'text-slate-600 hover:bg-sky-50/80 hover:text-slate-900'
          }`}
        >
          <span>中文</span>
        </button>

        {/* English Button */}
        <button
          type="button"
          id="btn-lang-en"
          onClick={(e) => handleSelect('en', e)}
          aria-pressed={language === 'en'}
          title="Switch to English (切换至英文)"
          className={`relative px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
            language === 'en'
              ? 'bg-gradient-to-r from-sky-400 to-teal-400 text-white shadow-sm ring-1 ring-sky-300/60'
              : 'text-slate-600 hover:bg-sky-50/80 hover:text-slate-900'
          }`}
        >
          <span>English</span>
        </button>
      </div>
    </div>
  );
};
