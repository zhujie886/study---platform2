import React, { useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { themes } from '@/themes';

export type ThemeName = (typeof themes)[number]['name'];
export type ThemeType = 'pink' | 'blue' | 'green' | 'purple' | 'orange' | 'ocean' | 'forest' | 'sunset' | 'cyber';
export type StyleMode = 'simple' | 'fancy';

interface ThemeState {
  theme: ThemeName;
  styleMode: StyleMode;
  setTheme: (theme: ThemeName | ThemeType) => void;
  setStyleMode: (mode: StyleMode) => void;
}

const SIMPLE_SUFFIX = ' · 简约';
const FANCY_SUFFIX = ' · 华丽';

const normalizeThemeKey = (value: string) => {
  const normalized = value
    .replace(/[\u00b7·]|路|-/g, ' · ')
    .replace(/简约|簡約|simple|ç®€çº¦/gi, '简约')
    .replace(/华丽|華麗|fancy|åŽä¸½|鍗庝附/gi, '华丽')
    .replace(/[?�]/g, '')
    .trim();
  return normalized.replace(/\s*·\s*/g, ' · ');
};

const isThemeName = (value: string): value is ThemeName => themes.some((t) => t.name === value);

const LEGACY_THEME_MAP: Record<ThemeType, string> = {
  pink: 'Sakura',
  blue: 'Cyber',
  green: 'Solarized',
  purple: 'Dracula',
  orange: 'Da Vinci',
  ocean: 'Cyber',
  forest: 'Van Gogh',
  sunset: 'Sakura',
  cyber: 'Cyber',
};

const resolveThemeName = (themeKey: string, mode: StyleMode): ThemeName => {
  const normalizedKey = normalizeThemeKey(themeKey);
  if (isThemeName(normalizedKey)) return normalizedKey;

  const baseSource = LEGACY_THEME_MAP[normalizedKey as ThemeType] || normalizedKey;
  const base = (baseSource as string).split(' · ')[0] || 'Sakura';
  const suffix = mode === 'fancy' ? FANCY_SUFFIX : SIMPLE_SUFFIX;
  const candidate = `${base}${suffix}`;
  if (isThemeName(candidate)) return candidate;
  return themes[0].name;
};

const findTheme = (name: ThemeName) => themes.find((t) => t.name === name) || themes[0];

const applyTheme = (themeKey: string, modeHint?: StyleMode) => {
  const hintMode: StyleMode = modeHint || 'simple';
  const resolvedName = resolveThemeName(themeKey, hintMode);
  const t = findTheme(resolvedName);
  const mode: StyleMode = modeHint || (t.type === 'gorgeous' ? 'fancy' : 'simple');
  const root = document.documentElement;
  Object.entries(t.styles).forEach(([key, value]) => root.style.setProperty(key, value));
  root.setAttribute('data-theme', t.name);
  root.setAttribute('data-style-mode', mode);
};

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: themes[0].name,
      styleMode: themes[0].type === 'gorgeous' ? 'fancy' : 'simple',
      setTheme: (themeKey) => {
        const raw = normalizeThemeKey(String(themeKey));
        if (isThemeName(raw)) {
          const next = findTheme(raw);
          const mode: StyleMode = next.type === 'gorgeous' ? 'fancy' : 'simple';
          set({ theme: next.name, styleMode: mode });
          applyTheme(next.name, mode);
          return;
        }

        const mode = get().styleMode;
        const nextName = resolveThemeName(raw, mode);
        const next = findTheme(nextName);
        set({ theme: next.name, styleMode: mode });
        applyTheme(next.name, mode);
      },
      setStyleMode: (mode) => {
        const base = normalizeThemeKey(get().theme).split(' · ')[0];
        const nextName = resolveThemeName(`${base}${mode === 'fancy' ? FANCY_SUFFIX : SIMPLE_SUFFIX}`, mode);
        set({ theme: nextName, styleMode: mode });
        applyTheme(nextName, mode);
      },
    }),
    {
      name: 'app-theme-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(String(state.theme), state.styleMode);
        }
      },
    }
  )
);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { theme, styleMode } = useTheme();

  useEffect(() => {
    applyTheme(theme, styleMode);
  }, [theme, styleMode]);

  return React.createElement(React.Fragment, null, children);
};
