"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  isLocale,
  LOCALE_META,
  messages,
  type Locale,
  type MessageKey,
} from "@/i18n/messages";
import type { BeltLevel } from "@/db/schema";

const STORAGE_KEY = "the-kick-lang";
const COOKIE_KEY = "the-kick-lang";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  tBelt: (belt: BeltLevel | null | undefined) => string;
  tAbsence: (type: string) => string;
  tStatus: (status: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_KEY}=`))
    ?.split("=")[1];
  if (isLocale(cookie)) return cookie;
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = LOCALE_META[locale].html;
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.cookie = `${COOKIE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: MessageKey) => messages[locale][key] ?? messages.en[key],
    [locale],
  );

  const tBelt = useCallback(
    (belt: BeltLevel | null | undefined) => {
      if (!belt) return t("noBelt");
      return t(`belt_${belt}` as MessageKey);
    },
    [t],
  );

  const tAbsence = useCallback(
    (type: string) => t(`absence_${type}` as MessageKey),
    [t],
  );

  const tStatus = useCallback(
    (status: string) => {
      const key = `status_${status}` as MessageKey;
      return messages[locale][key] ?? status.replaceAll("_", " ");
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, tBelt, tAbsence, tStatus }),
    [locale, setLocale, t, tBelt, tAbsence, tStatus],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}
