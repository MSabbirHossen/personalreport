import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "system";
type ThemeContextValue = { theme: Theme; resolvedTheme: "light" | "dark"; setTheme: (theme: Theme) => void; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "report-bd-theme";

function systemTheme(): "light" | "dark" {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children, defaultTheme = "system" }: React.PropsWithChildren<{ defaultTheme?: Theme }>) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try { return (window.localStorage.getItem(STORAGE_KEY) as Theme) || defaultTheme; } catch { return defaultTheme; }
  });
  const [system, setSystem] = useState<"light" | "dark">(systemTheme);

  const resolvedTheme = theme === "system" ? system : theme;
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystem(media.matches ? "dark" : "light");
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* Storage may be blocked. */ }
  }, [theme, resolvedTheme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(() => setThemeState(current => (current === "dark" ? "light" : "dark")), []);
  const value = useMemo(() => ({ theme, resolvedTheme, setTheme, toggleTheme }), [theme, resolvedTheme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
