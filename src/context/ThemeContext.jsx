import { createContext, useContext, useEffect, useState } from 'react';

/* Dark/light theming. Default is dark — that's the app's real identity.
   We persist the choice and apply it as data-theme on <html>, which the
   CSS variable blocks in index.css key off. This is the dark-mode toggle
   that the original Settings page showed but never actually wired up. */

const ThemeContext = createContext(null);
const STORAGE_KEY = 'oh-sheet-theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
