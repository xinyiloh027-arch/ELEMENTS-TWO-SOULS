import React, { createContext, useContext, useEffect, useState } from 'react';
import { enTranslations } from './en';
import { Language, TranslationDictionary } from './types';
import { zhTranslations } from './zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: TranslationDictionary;
}

const STORAGE_KEY = 'elements_language';
const FALLBACK_STORAGE_KEY = 'twinquest_language';

/**
 * Determine initial language preference:
 * 1. Previously stored preference in localStorage
 * 2. Browser language detection (Chinese if starts with 'zh', otherwise English)
 */
function resolveInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem(FALLBACK_STORAGE_KEY);
      if (stored === 'zh' || stored === 'en') {
        return stored;
      }
      const browserLang = navigator.language?.toLowerCase() || '';
      if (browserLang.startsWith('zh')) {
        return 'zh';
      }
    } catch {
      // Ignore storage access restrictions
    }
  }
  return 'en';
}

// Global state for non-React contexts (e.g. 2D Canvas rendering & Game Engine banter)
let globalLanguage: Language = resolveInitialLanguage();
const languageListeners: Set<(lang: Language, t: TranslationDictionary) => void> = new Set();

export function getCurrentLanguage(): Language {
  return globalLanguage;
}

export function getCurrentTranslations(): TranslationDictionary {
  return globalLanguage === 'zh' ? zhTranslations : enTranslations;
}

export function subscribeLanguage(
  listener: (lang: Language, t: TranslationDictionary) => void
): () => void {
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
  };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => resolveInitialLanguage());

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    globalLanguage = newLang;
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      localStorage.setItem(FALLBACK_STORAGE_KEY, newLang);
    } catch {
      // Storage exceptions ignored
    }
    const currentDict = newLang === 'zh' ? zhTranslations : enTranslations;
    languageListeners.forEach((fn) => fn(newLang, currentDict));
  };

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  // Sync state if another tab or component updates language
  useEffect(() => {
    globalLanguage = language;
  }, [language]);

  const t = language === 'zh' ? zhTranslations : enTranslations;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
