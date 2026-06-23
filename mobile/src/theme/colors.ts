/**
 * Warm Obsidian + Gold palette.
 * A charcoal-black canvas with champagne/gold accents — Amex-Platinum energy.
 */
export const colors = {
  // Canvas
  bg: '#0C0A08',
  bgGlowTop: '#241B10', // warm radial glow behind the hero
  bgGlowBottom: '#0C0A08',

  // Surfaces (solid fallbacks; glass cards layer blur on top of these)
  surface: '#17130E',
  surfaceElevated: '#1F1A13',
  surfaceTranslucent: 'rgba(31, 26, 19, 0.55)',
  surfaceTranslucentStrong: 'rgba(33, 28, 20, 0.72)',

  // Hairlines / borders
  border: 'rgba(212, 175, 110, 0.14)',
  borderStrong: 'rgba(212, 175, 110, 0.28)',
  hairline: 'rgba(245, 239, 230, 0.06)',

  // Text
  textPrimary: '#F5EFE6',
  textSecondary: '#A89B86',
  textMuted: '#6E6557',
  textOnGold: '#1A1305',

  // Gold
  gold: '#D4AF6E',
  goldBright: '#EBD2A0',
  goldDeep: '#B5863A',

  // Status
  success: '#7FBF8E',
  successSoft: 'rgba(127, 191, 142, 0.14)',
  warning: '#E0B15A',
  danger: '#E0735E',
  dangerSoft: 'rgba(224, 115, 94, 0.14)',

  // Pure
  white: '#FFFFFF',
  black: '#000000',
} as const;

/** Gradient stop sets used across the app. */
export const gradients = {
  gold: ['#F0D9A8', '#D4AF6E', '#B5863A'] as const,
  goldSoft: ['#D4AF6E', '#B5863A'] as const,
  hero: ['#2A2114', '#15110B', '#0C0A08'] as const,
  card: ['rgba(48,40,28,0.65)', 'rgba(24,20,14,0.55)'] as const,
  ringTrack: ['rgba(212,175,110,0.10)', 'rgba(212,175,110,0.10)'] as const,
};
