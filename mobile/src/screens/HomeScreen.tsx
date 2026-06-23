import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { GoalCard } from '@/components/GoalCard';
import { GradientButton } from '@/components/GradientButton';
import { IconButton } from '@/components/IconButton';
import { Logo } from '@/components/Logo';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { useGoals } from '@/api/goals';
import { useAuthStore } from '@/store/authStore';
import { colors, formatEuro, spacing } from '@/theme';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: goals, isLoading, refetch, isRefetching } = useGoals();
  const email = useAuthStore((s) => s.session?.email ?? '');

  const stats = useMemo(() => {
    const list = goals ?? [];
    const active = list.filter((g) => g.status === 'Active');
    const totalSaved = list.reduce((sum, g) => sum + g.totalSaved, 0);
    const totalTarget = list.reduce((sum, g) => sum + (g.targetAmount ?? 0), 0);
    return {
      totalSaved,
      totalTarget,
      progress: totalTarget > 0 ? totalSaved / totalTarget : 0,
      activeCount: active.length,
      count: list.length,
    };
  }, [goals]);

  // The floating tab bar pill (~64) sits a safe-inset + 8 above the screen bottom.
  // Lift the action button clear of it, then pad the scroll list past both.
  const safeBottom = insets.bottom || 0;
  const tabBarSpace = safeBottom + 80; // pill height + breathing room
  const fabBottomPad = tabBarSpace + spacing.lg;

  return (
    <View style={styles.root}>
      <Screen
        onRefresh={refetch}
        refreshing={isRefetching}
        contentStyle={{ paddingBottom: fabBottomPad + 64 + spacing.xl }}
      >
        <View style={styles.headerRow}>
          <Logo />
          <IconButton glyph="☰" onPress={() => router.push('/(app)/profile')} />
        </View>

        <Animated.View entering={FadeInDown.duration(600)}>
          <GlassCard featured padding={spacing.xl}>
            <AppText variant="label">Total saved</AppText>
            <AppText variant="hero" style={styles.hero}>{formatEuro(stats.totalSaved)}</AppText>

            {stats.totalTarget > 0 && (
              <View style={styles.progressBlock}>
                <ProgressBar progress={stats.progress} />
                <View style={styles.progressMeta}>
                  <AppText variant="caption" color={colors.textMuted}>
                    {Math.round(stats.progress * 100)}% of {formatEuro(stats.totalTarget)}
                  </AppText>
                  <AppText variant="caption" color={colors.gold}>
                    {stats.activeCount} active
                  </AppText>
                </View>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <AppText variant="title">Your goals</AppText>
          {!!stats.count && (
            <AppText variant="caption" color={colors.textMuted}>{stats.count} total</AppText>
          )}
        </View>

        {isLoading ? (
          <AppText variant="bodyMuted">Loading…</AppText>
        ) : stats.count === 0 ? (
          <EmptyState
            glyph="✦"
            title="No goals yet"
            subtitle="Create your first savings goal and let it grow on its own."
          />
        ) : (
          <View style={styles.list}>
            {goals!.map((goal, i) => (
              <Animated.View key={goal.id} entering={FadeInDown.duration(500).delay(80 * i)}>
                <GoalCard goal={goal} onPress={() => router.push(`/(app)/goal/${goal.id}`)} />
              </Animated.View>
            ))}
          </View>
        )}
      </Screen>

      <View style={[styles.fab, { paddingBottom: fabBottomPad }]} pointerEvents="box-none">
        <LinearGradient
          colors={['rgba(12,10,8,0)', colors.bg]}
          style={styles.fabScrim}
          pointerEvents="none"
        />
        <GradientButton label="New goal" onPress={() => router.push('/(app)/create')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  hero: { marginTop: spacing.sm, marginBottom: spacing.md },
  progressBlock: { gap: spacing.sm, marginTop: spacing.sm },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing['2xl'],
    marginBottom: spacing.base,
  },
  list: { gap: spacing.base },
  fab: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
  },
  fabScrim: {
    position: 'absolute',
    left: -spacing.lg,
    right: -spacing.lg,
    top: -spacing['2xl'],
    bottom: 0,
  },
});
