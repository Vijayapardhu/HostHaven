import { useEffect } from 'react';
import { usePublicPlatformSettings } from '@/hooks/usePublicPlatformSettings';
import { DEFAULT_COLORS } from '@/lib/publicSettings';

const CSS_VAR_MAP: Record<string, string> = {
  primary: '--primary',
  secondary: '--secondary',
  accent: '--accent',
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  heritage: '--heritage-brown',
};

export function ThemeInjector() {
  const settings = usePublicPlatformSettings();
  const colors = settings.colors ?? DEFAULT_COLORS;

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
      const value = (colors as any)[key];
      if (value) {
        root.style.setProperty(cssVar, value);
      }
    }
  }, [colors]);

  return null;
}
