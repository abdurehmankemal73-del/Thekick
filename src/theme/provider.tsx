"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isThemeId, type ThemeId } from "@/theme/themes";

const STORAGE_KEY = "the-kick-theme";
const COOKIE_KEY = "the-kick-theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "classic";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isThemeId(stored)) return stored;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_KEY}=`))
    ?.split("=")[1];
  if (isThemeId(cookie)) return cookie;
  return "classic";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("classic");

  useEffect(() => {
    setThemeState(readStoredTheme());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
    document.cookie = `${COOKIE_KEY}=${theme};path=/;max-age=31536000;samesite=lax`;
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "classic" ? "mint" : "classic"));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
