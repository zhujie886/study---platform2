import { themes, Theme } from '@/themes';
import { useTheme } from '@/hooks/useTheme';

export const useThemeStore = () => {
  const { theme: themeName, setTheme } = useTheme();
  const active: Theme = themes.find((t) => t.name === themeName) || themes[0];
  return { theme: active, setTheme };
};
