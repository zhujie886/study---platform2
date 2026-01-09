import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, Lang } from './translations';

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string;
};

const LanguageContext = createContext<LangContextValue | undefined>(undefined);

const STORAGE_KEY = 'app_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return saved === 'en' || saved === 'zh' ? saved : 'zh';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (next: Lang) => setLangState(next);

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>, fallback?: string) => {
      const table = translations[lang] || translations.zh;
      let template = table[key] || translations.zh[key] || fallback || key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return template;
    };
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
