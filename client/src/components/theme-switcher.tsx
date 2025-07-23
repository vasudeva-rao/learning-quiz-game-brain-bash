import * as React from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Palette } from "lucide-react";

type Theme = "original" | "light" | "dark";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes: Array<{ 
    value: Theme; 
    icon: typeof Palette; 
    label: string;
  }> = [
    { value: "original", icon: Palette, label: "Original" },
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" }
  ];

  const currentThemeIndex = themes.findIndex(t => t.value === theme);
  const currentTheme = themes[currentThemeIndex];

  const cycleTheme = () => {
    const nextIndex = (currentThemeIndex + 1) % themes.length;
    setTheme(themes[nextIndex].value);
  };

  const Icon = currentTheme.icon;

  // Theme-specific styling that looks great
  const getThemeStyles = () => {
    switch (theme) {
      case "original":
        return "bg-gradient-to-br from-violet-500 via-purple-600 to-blue-600 hover:from-violet-400 hover:via-purple-500 hover:to-blue-500 border-2 border-white/40 hover:border-white/60 shadow-2xl text-white hover:shadow-[0_20px_40px_-10px_rgba(139,92,246,0.4)]";
      case "light":
        return "bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 hover:border-gray-400 shadow-lg hover:shadow-xl text-gray-600 hover:text-gray-700";
      case "dark":
        return "bg-gray-700 hover:bg-gray-600 border-2 border-gray-500 hover:border-gray-400 shadow-2xl text-gray-200 hover:text-gray-100";
      default:
        return "bg-gradient-to-br from-violet-500 via-purple-600 to-blue-600 text-white border-2 border-white/40";
    }
  };

  return (
    <Button
      onClick={cycleTheme}
      variant="ghost"
      size="sm"
      className={`group relative transition-all duration-300 w-12 h-12 rounded-full flex items-center justify-center p-0 ${getThemeStyles()}`}
      title={`Current: ${currentTheme.label} (click to cycle)`}
    >
      <Icon className="w-5 h-5 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 drop-shadow-sm" />
      <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Button>
  );
} 