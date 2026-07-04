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

// Return an "H S% L%" triplet with lightness nudged by `delta` (clamped 0-100).
function adjustL(hsl: string, delta: number): string {
  const parsed = parseHsl(hsl);
  if (!parsed) return hsl;
  const l = Math.max(0, Math.min(100, parsed.l + delta));
  return `${parsed.h} ${parsed.s}% ${l}%`;
}

/**
 * Applies the admin-configured brand colors to the document as CSS variables.
 *
 * The site is a two-tone brand: `primary` is the main surface/button color
 * (e.g. navy) while `accent` is the warm "gold" highlight. So the gold family
 * (gold/gold-light/gold-dark, focus ring, glow, gradients) tracks `accent`,
 * and the primary color drives buttons plus the sidebar highlight. This keeps
 * a navy-primary + gold-accent combo intact instead of collapsing both tones
 * into one.
 */
function applyColors(colors: PublicColorsSettings) {
  const root = document.documentElement;

  // Base tokens.
  (Object.keys(CSS_VAR_MAP) as (keyof PublicColorsSettings)[]).forEach((key) => {
    const value = colors[key];
    if (value) root.style.setProperty(CSS_VAR_MAP[key], value);
  });

  const { primary, secondary, accent } = colors;

  // The warm highlight color drives the whole "gold" family. Fall back to
  // primary if no accent is configured.
  const warm = accent || primary;

  // Contrast-aware foregrounds so text stays legible on any chosen color.
  if (primary) root.style.setProperty('--primary-foreground', contrastForeground(primary));
  if (accent) root.style.setProperty('--accent-foreground', contrastForeground(accent));

  // Gold family + focus ring + glow, all derived from the warm accent.
  if (warm) {
    root.style.setProperty('--gold', warm);
    root.style.setProperty('--gold-light', adjustL(warm, 14));
    root.style.setProperty('--gold-dark', adjustL(warm, -12));
    // Other warm brand tokens so nothing stays the old orange.
    root.style.setProperty('--saffron', warm);
    root.style.setProperty('--temple-orange', adjustL(warm, -4));
    root.style.setProperty('--ring', warm);
    root.style.setProperty('--sidebar-ring', warm);
    root.style.setProperty('--shadow-gold', `0 4px 20px -2px hsl(${warm} / 0.35)`);
    root.style.setProperty('--shadow-glow', `0 0 20px hsl(${warm} / 0.4)`);
    root.style.setProperty(
      '--gradient-gold',
      `linear-gradient(135deg, hsl(${warm}) 0%, hsl(${adjustL(warm, 8)}) 100%)`,
    );
    root.style.setProperty(
      '--gradient-gold-soft',
      `linear-gradient(135deg, hsl(${adjustL(warm, 14)}) 0%, hsl(${warm}) 100%)`,
    );
  }

  // Primary drives the sidebar highlight; secondary tints the sidebar surface.
  if (primary) root.style.setProperty('--sidebar-primary', primary);
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
