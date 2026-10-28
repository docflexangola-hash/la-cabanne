'use client';

import { useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'lc-theme';

function getHour(): number {
  return new Date().getHours();
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  const hour = getHour();
  if (hour >= 18 || hour < 6) return 'dark';
  return 'light';
}

function applyTheme(theme: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>('auto');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        setPreference(stored);
      } else {
        setPreference('auto');
      }
    } catch {
      setPreference('auto');
    }
  }, []);

  useEffect(() => {
    const resolvedTheme = resolveTheme(preference);
    setResolved(resolvedTheme);
    applyTheme(resolvedTheme);
  }, [preference]);

  useEffect(() => {
    if (preference !== 'auto') return;
    const interval = setInterval(() => {
      const resolvedTheme = resolveTheme('auto');
      setResolved(resolvedTheme);
      applyTheme(resolvedTheme);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [preference]);

  function setTheme(pref: ThemePreference) {
    setPreference(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {}
  }

  function toggle() {
    if (preference === 'light') {
      setTheme('dark');
    } else if (preference === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  }

  return { preference, resolved, setTheme, toggle };
}
