import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'cyberpunk' | 'agro-nature';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: { id: Theme; name: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme';

const themes: ThemeContextType['themes'] = [
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Dark tech with electric blue accents' },
  { id: 'agro-nature', name: 'Agro Nature', description: 'Deep forest green with lime accents' },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      return saved && themes.some(t => t.id === saved) ? saved : 'cyberpunk';
    }
    return 'cyberpunk';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // 1. Clean slate - remove ALL possible theme classes first
    root.classList.remove("light", "dark", "theme-agro-nature", "theme-cyberpunk");
    body.classList.remove("light", "dark", "theme-agro-nature", "theme-cyberpunk");
    
    // 2. Apply strictly ONE state (exclusive mode)
    if (theme === "agro-nature") {
      root.classList.add("theme-agro-nature");
      body.classList.add("theme-agro-nature");
    } else {
      // Default to dark/cyberpunk
      root.classList.add("dark");
      body.classList.add("dark");
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
