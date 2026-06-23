import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { colors, fontFamily, fontSize, letterSpacing } from '@/theme';

type Variant =
  | 'hero'      // big serif money
  | 'display'   // serif screen title
  | 'title'     // serif section title
  | 'h2'
  | 'body'
  | 'bodyMuted'
  | 'label'     // small uppercase tracked label
  | 'caption'
  | 'mono';     // tabular money in UI

const variantStyle: Record<Variant, TextStyle> = {
  hero: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize.hero,
    color: colors.textPrimary,
    letterSpacing: letterSpacing.tighter,
  },
  display: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: letterSpacing.tight,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  bodyMuted: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  mono: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[variantStyle[variant], color ? { color } : null, style]}
    />
  );
}

export const textStyles = StyleSheet.create(variantStyle as any);
