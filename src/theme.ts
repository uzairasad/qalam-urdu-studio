/**
 * Light / dark theme: follows the system unless the user picked one (View → Theme).
 * The choice is kept in localStorage; `data-theme` on <html> drives the CSS (index.css).
 */
import { useEffect, useState } from 'react';

export type ThemeChoice = 'system' | 'light' | 'dark';
const KEY = 'qalam_theme';

function stored(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // storage unavailable
  }
  return 'system';
}

export function useTheme(): [ThemeChoice, (t: ThemeChoice) => void] {
  const [choice, setChoice] = useState<ThemeChoice>(stored);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = choice === 'dark' || (choice === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [choice]);
  const set = (t: ThemeChoice) => {
    setChoice(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      // storage unavailable
    }
  };
  return [choice, set];
}
