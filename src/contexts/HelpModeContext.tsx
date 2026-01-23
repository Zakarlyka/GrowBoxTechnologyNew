import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HelpModeContextType {
  isHelpModeEnabled: boolean;
  toggleHelpMode: () => void;
  setHelpMode: (enabled: boolean) => void;
}

const HelpModeContext = createContext<HelpModeContextType | undefined>(undefined);

const STORAGE_KEY = 'help-mode-enabled';

export function HelpModeProvider({ children }: { children: ReactNode }) {
  const [isHelpModeEnabled, setIsHelpModeEnabled] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isHelpModeEnabled));
  }, [isHelpModeEnabled]);

  const toggleHelpMode = () => setIsHelpModeEnabled(prev => !prev);
  const setHelpMode = (enabled: boolean) => setIsHelpModeEnabled(enabled);

  return (
    <HelpModeContext.Provider value={{ isHelpModeEnabled, toggleHelpMode, setHelpMode }}>
      {children}
    </HelpModeContext.Provider>
  );
}

export function useHelpMode() {
  const context = useContext(HelpModeContext);
  if (context === undefined) {
    throw new Error('useHelpMode must be used within a HelpModeProvider');
  }
  return context;
}
