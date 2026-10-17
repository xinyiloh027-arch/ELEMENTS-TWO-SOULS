import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  compact = false,
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={`relative inline-flex items-center select-none ${className}`}
      role="group"
      aria-label={t.selectorLabel}
    >
      {/* Art Nouveau Ornate Decorative Background & Vine Silhouette */}
      <div className="relative flex items-center gap-1.5 p-1 sm:p-1.5 rounded-full bg-[#fdfbf7]/95 border-2 border-[#1e3a8a]/30 shadow-md shadow-sky-950/10 backdrop-blur-md">
        {/* Curving green vine & floral SVG ornaments on left and right */}
        <div className="absolute -top-1.5 -left-1.5 pointer-events-none w-5 h-5 text-emerald-700/80">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            {/* Curving green vine */}
            <path
              d="M2 18 C 3 10, 10 4, 18 2"
              stroke="#2d6a4f"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Delicate botanical leaf */}
            <path
              d="M7 11 C 5 8, 9 7, 10 9 C 9 11, 8 12, 7 11 Z"
              fill="#52b788"
            />
            {/* Small red floral blossom */}
            <circle cx="16" cy="3.5" r="2.2" fill="#e63946" />
            <circle cx="16" cy="3.5" r="0.9" fill="#fef08a" />
          </svg>
        </div>

        <div className="absolute -bottom-1.5 -right-1.5 pointer-events-none w-5 h-5 text-emerald-700/80 rotate-180">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            {/* Curving green vine */}
            <path
              d="M2 18 C 3 10, 10 4, 18 2"
              stroke="#2d6a4f"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Delicate botanical leaf */}
            <path
              d="M7 11 C 5 8, 9 7, 10 9 C 9 11, 8 12, 7 11 Z"
              fill="#52b788"
            />
            {/* Small red floral blossom */}
            <circle cx="16" cy="3.5" r="2.2" fill="#e63946" />
            <circle cx="16" cy="3.5" r="0.9" fill="#fef08a" />
          </svg>
        </div>

        {/* Globe Icon & Title Tag */}
        <div className="flex items-center gap-1 pl-2 pr-1.5 text-xs font-bold text-[#1e3a8a]">
          <Globe className="w-3.5 h-3.5 text-cobalt-600 animate-spin-slow text-[#1e40af]" />
          {!compact && (
            <span className="hidden sm:inline font-serif tracking-wide text-[11px] text-[#1e3a8a]/90">
              语言 / Language
            </span>
          )}
        </div>

        {/* Chinese Button */}
        <button
          type="button"
          id="btn-lang-zh"
          onClick={() => setLanguage('zh')}
          aria-pressed={language === 'zh'}
          title="切换至中文 (Switch to Chinese)"
          className={`relative px-3 py-1 sm:py-1.5 rounded-full text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 ${
            language === 'zh'
              ? 'bg-gradient-to-r from-[#1e40af] to-[#2563eb] text-[#fefae0] shadow-sm shadow-blue-900/30 ring-1 ring-amber-300/60'
              : 'text-[#1e3a8a] hover:bg-emerald-50/80 hover:text-emerald-900'
          }`}
        >
          {/* Active floral jewel indicator */}
          {language === 'zh' && (
            <span className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-[#e63946] border border-white ring-1 ring-amber-300" />
          )}
          <span>中文</span>
        </button>

        {/* English Button */}
        <button
          type="button"
          id="btn-lang-en"
          onClick={() => setLanguage('en')}
          aria-pressed={language === 'en'}
          title="Switch to English (切换至英文)"
          className={`relative px-3 py-1 sm:py-1.5 rounded-full text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 ${
            language === 'en'
              ? 'bg-gradient-to-r from-[#1e40af] to-[#2563eb] text-[#fefae0] shadow-sm shadow-blue-900/30 ring-1 ring-amber-300/60'
              : 'text-[#1e3a8a] hover:bg-emerald-50/80 hover:text-emerald-900'
          }`}
        >
          {/* Active floral jewel indicator */}
          {language === 'en' && (
            <span className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-[#e63946] border border-white ring-1 ring-amber-300" />
          )}
          <span>English</span>
        </button>
      </div>
    </div>
  );
};
