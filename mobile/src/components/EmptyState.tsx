import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

export function EmptyState({
  glyph = '✦',
  title,
  subtitle,
}: {
  glyph?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glyphWrap}>
        <AppText style={styles.glyph}>{glyph}</AppText>
      </View>
      <AppText variant="title" style={styles.title}>{title}</AppText>
      {subtitle && (
        <AppText variant="bodyMuted" style={styles.subtitle}>{subtitle}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.sm },
  glyphWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  glyph: { fontSize: 28, color: colors.gold },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 280 },
});
