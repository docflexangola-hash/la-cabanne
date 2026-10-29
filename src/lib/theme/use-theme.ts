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
  throw new Error('useTheme must be used within ThemeProvider');
}
