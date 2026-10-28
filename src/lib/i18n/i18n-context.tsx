'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { dictionaries, type Locale } from './dictionaries';

const STORAGE_KEY = 'lc-lang';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggle: () => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === 'pt' || stored === 'en') {
        setLocaleState(stored);
      } else {
        setLocaleState('pt');
      }
    } catch {
      setLocaleState('pt');
    }
  }, []);

  function setLocale(locale: Locale) {
    setLocaleState(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {}
  }

  function toggle() {
    setLocale(locale === 'pt' ? 'en' : 'pt');
  }

  function t(key: string) {
    return dictionaries[locale][key] ?? dictionaries.pt[key] ?? key;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggle, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return ctx;
}
