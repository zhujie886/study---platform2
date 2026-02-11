import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, Lang } from './translations';

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string;
};

const LanguageContext = createContext<LangContextValue | undefined>(undefined);

const STORAGE_KEY = 'app_lang';
const CJK_RE = /[\u3400-\u9fff]/;
const legacyKeyCache = new Map<string, string>();

function toLegacyMojibakeKey(key: string): string {
  if (!CJK_RE.test(key)) return key;
  const cached = legacyKeyCache.get(key);
  if (cached) return cached;
  try {
    // Legacy dictionaries accidentally stored some Chinese keys as UTF-8 bytes decoded by GBK.
    const converted = new TextDecoder('gbk').decode(new TextEncoder().encode(key));
    legacyKeyCache.set(key, converted);
    return converted;
  } catch {
    legacyKeyCache.set(key, key);
    return key;
  }
}

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
      const legacyKey = toLegacyMojibakeKey(key);
      let template =
        table[key] ||
        table[legacyKey] ||
        translations.zh[key] ||
        translations.zh[legacyKey] ||
        fallback ||
        key;
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
