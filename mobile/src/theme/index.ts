export { colors, gradients } from './colors';
export { fontFamily, fontSize, lineHeight, letterSpacing } from './typography';
export { spacing, radius, shadow } from './spacing';

/** Format a number as euros with grouped thousands and 2 decimals. */
export function formatEuro(amount: number, withSymbol = true): string {
  const formatted = new Intl.NumberFormat('en-IE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
  return withSymbol ? `€${formatted}` : formatted;
}
