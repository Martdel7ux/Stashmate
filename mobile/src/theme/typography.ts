/**
 * Type system. Fraunces (soft serif) carries the money hero and screen titles;
 * Inter handles all UI text. Money always uses tabular figures so digits don't jitter.
 */
export const fontFamily = {
  // Display serif
  serif: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
  // UI sans
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 40,
  hero: 56,
} as const;

export const lineHeight = {
  tight: 1.05,
  snug: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  tighter: -1.2,
  tight: -0.5,
  normal: 0,
  wide: 0.4,
  wider: 1.2,
  widest: 2.4,
} as const;
