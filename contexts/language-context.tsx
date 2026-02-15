"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/dictionary";
import {
  DEFAULT_LOCALE,
  dictionary,
  getStoredLocale,
  setStoredLocale,
} from "@/lib/dictionary";
import { de, enUS, es, fr, pt, ru, zhCN } from "date-fns/locale";

const dateFnsMap: Record<Locale, typeof enUS> = {
  en: enUS,
  ru,
  es,
  fr,
  de,
  zh: zhCN,
  pt,
};

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dateFnsLocale: typeof enUS;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setStoredLocale(next);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const dict = dictionary[locale];
      return dict[key] ?? dictionary[DEFAULT_LOCALE][key] ?? key;
    },
    [locale]
  );

  const dateFnsLocale = dateFnsMap[locale] ?? enUS;
  const value: LanguageContextValue = { locale, setLocale, t, dateFnsLocale };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
