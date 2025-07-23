import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "original" | "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("original");

  useEffect(() => {
    const storedTheme = localStorage.getItem("quiz-theme") as Theme;
    if (storedTheme && ["original", "light", "dark"].includes(storedTheme)) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("quiz-theme", theme);
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove("theme-original", "theme-light", "theme-dark");

    // Add current theme class
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
