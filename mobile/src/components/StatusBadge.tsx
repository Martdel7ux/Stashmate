import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';
import type { GoalStatus } from '@/api/types';

const config: Record<GoalStatus, { label: string; color: string; bg: string }> = {
  Active: { label: 'Active', color: colors.success, bg: colors.successSoft },
  Paused: { label: 'Paused', color: colors.warning, bg: 'rgba(224,177,90,0.14)' },
  Completed: { label: 'Completed', color: colors.gold, bg: 'rgba(212,175,110,0.16)' },
  Cancelled: { label: 'Cancelled', color: colors.danger, bg: colors.dangerSoft },
};

export function StatusBadge({ status }: { status: GoalStatus }) {
  const c = config[status] ?? config.Active;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.color }]} />
      <AppText variant="caption" color={c.color} style={styles.text}>
        {c.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, letterSpacing: 0.3 },
});
