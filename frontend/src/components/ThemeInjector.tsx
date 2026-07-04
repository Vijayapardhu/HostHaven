import { useEffect } from 'react';
import { usePublicPlatformSettings } from '@/hooks/usePublicPlatformSettings';
import { DEFAULT_COLORS, type PublicColorsSettings } from '@/lib/publicSettings';

const CACHE_KEY = 'hh-brand-colors';

// Base HSL-triplet variables that map 1:1 to an admin-configurable color.
const CSS_VAR_MAP: Record<keyof PublicColorsSettings, string> = {
  primary: '--primary',
  secondary: '--secondary',
  accent: '--accent',
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  heritage: '--heritage-brown',
};

// Parse an "H S% L%" triplet into numbers; returns null if malformed.
function parseHsl(hsl?: string): { h: number; s: number; l: number } | null {
  if (!hsl) return null;
  const parts = hsl.trim().replace(/%/g, '').split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { h: parts[0], s: parts[1], l: parts[2] };
}

// Pick a readable foreground (near-white or near-black) for a given base color.
function contrastForeground(hsl?: string): string {
  const parsed = parseHsl(hsl);
  if (!parsed) return '0 0% 100%';
  return parsed.l > 60 ? '30 10% 15%' : '0 0% 100%';
}

/**
 * Applies the admin-configured brand colors to the document as CSS variables.
 * Beyond the seven base tokens it also cascades to every derived brand
 * variable (gold family, focus ring, sidebar, gradients, shadows) so a single
 * "primary" change re-themes the whole site consistently instead of leaving
 * the old gold accents behind.
 */
function applyColors(colors: PublicColorsSettings) {
  const root = document.documentElement;

  // Base tokens.
  (Object.keys(CSS_VAR_MAP) as (keyof PublicColorsSettings)[]).forEach((key) => {
    const value = colors[key];
    if (value) root.style.setProperty(CSS_VAR_MAP[key], value);
  });

  const { primary, secondary, accent } = colors;

  // Contrast-aware foregrounds so text stays legible on any chosen color.
  if (primary) root.style.setProperty('--primary-foreground', contrastForeground(primary));
  if (accent) root.style.setProperty('--accent-foreground', contrastForeground(accent));

  // Primary drives the gold accent, focus ring and sidebar highlight.
  if (primary) {
    root.style.setProperty('--gold', primary);
    root.style.setProperty('--ring', primary);
    root.style.setProperty('--sidebar-primary', primary);
    root.style.setProperty('--sidebar-ring', primary);
    root.style.setProperty('--shadow-gold', `0 4px 20px -2px hsl(${primary} / 0.35)`);
    root.style.setProperty('--shadow-glow', `0 0 20px hsl(${primary} / 0.4)`);
  }

  // Gradients blend primary -> accent for the signature "gold" look.
  if (primary && accent) {
    root.style.setProperty(
      '--gradient-gold',
      `linear-gradient(135deg, hsl(${primary}) 0%, hsl(${accent}) 100%)`,
    );
    root.style.setProperty(
      '--gradient-gold-soft',
      `linear-gradient(135deg, hsl(${accent}) 0%, hsl(${primary}) 100%)`,
    );
  }

  // Secondary tints the sidebar surface.
  if (secondary) root.style.setProperty('--sidebar-accent', secondary);
}

// Apply cached colors synchronously on module load to avoid a flash of the
// default theme before the settings request resolves.
try {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) applyColors({ ...DEFAULT_COLORS, ...JSON.parse(cached) });
} catch {
  /* ignore malformed cache */
}

export function ThemeInjector() {
  const settings = usePublicPlatformSettings();
  const colors = settings.colors ?? DEFAULT_COLORS;

  useEffect(() => {
    applyColors(colors);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(colors));
    } catch {
      /* ignore storage errors (private mode / quota) */
    }
  }, [colors]);

  return null;
}
