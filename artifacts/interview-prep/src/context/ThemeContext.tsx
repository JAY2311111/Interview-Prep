import { createContext, useContext, useEffect, useState } from "react";
import { db, type AppSettings } from "@/lib/db";

interface ThemeContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<Omit<AppSettings, "id">>) => Promise<void>;
}

const defaultSettings: AppSettings = {
  id: "settings",
  themeMode: "system",
  fontFamily: "Inter",
  fontSize: "medium",
};

const ThemeContext = createContext<ThemeContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
});

const FONT_FAMILIES: Record<string, string> = {
  Inter: "'Inter', sans-serif",
  "JetBrains Mono": "'JetBrains Mono', monospace",
  "Georgia": "Georgia, serif",
  "System": "system-ui, sans-serif",
};

const FONT_SIZES: Record<string, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    db.settings.get("settings").then((s) => {
      if (s) setSettings(s);
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    // Apply theme mode
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (settings.themeMode === "dark" || (settings.themeMode === "system" && prefersDark)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply font family
    const fontFamily = FONT_FAMILIES[settings.fontFamily] ?? FONT_FAMILIES["Inter"];
    root.style.setProperty("--app-font-sans", fontFamily);

    // Apply font size
    const fontSize = FONT_SIZES[settings.fontSize] ?? FONT_SIZES["medium"];
    root.style.fontSize = fontSize;
  }, [settings]);

  const updateSettings = async (updates: Partial<Omit<AppSettings, "id">>) => {
    const updated = { ...settings, ...updates };
    await db.settings.put(updated);
    setSettings(updated);
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
