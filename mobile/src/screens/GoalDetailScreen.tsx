import { View, StyleSheet, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { ProgressRing } from '@/components/ProgressRing';
import { StatusBadge } from '@/components/StatusBadge';
import { TransactionRow } from '@/components/TransactionRow';
import { EmptyState } from '@/components/EmptyState';
import { useGoal, useTransactions, usePauseGoal, useResumeGoal, useCancelGoal } from '@/api/goals';
import { colors, formatEuro, spacing } from '@/theme';

export function GoalDetailScreen({ id }: { id: string }) {
  const { data: goal, isLoading, refetch, isRefetching } = useGoal(id);
  const { data: transactions } = useTransactions(id);
  const pause = usePauseGoal();
  const resume = useResumeGoal();
  const cancel = useCancelGoal();

  if (isLoading || !goal) {
    return (
      <Screen>
        <Header onBack subtitle="Goal" title="Loading…" />
      </Screen>
    );
  }

  const progress = goal.targetAmount && goal.targetAmount > 0 ? goal.totalSaved / goal.targetAmount : 0;
  const pct = Math.round(Math.min(1, progress) * 100);
  const remaining = goal.targetAmount ? Math.max(0, goal.targetAmount - goal.totalSaved) : null;
  const busy = pause.isPending || resume.isPending || cancel.isPending;

  const confirmCancel = () => {
    const doCancel = async () => {
      await cancel.mutateAsync(id);
      router.back();
    };
    if (Platform.OS === 'web') { doCancel(); return; }
    Alert.alert('Cancel goal?', 'This stops all future debits. Saved funds stay in your wallet.', [
      { text: 'Keep goal', style: 'cancel' },
      { text: 'Cancel goal', style: 'destructive', onPress: doCancel },
    ]);
  };

  const recent = (transactions ?? []).slice(0, 4);

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <Header onBack subtitle="Savings goal" title={goal.name} right={<StatusBadge status={goal.status} />} />

      <Animated.View entering={FadeIn.duration(500)} style={styles.ringWrap}>
        <ProgressRing progress={progress} size={210} strokeWidth={14}>
          <View style={styles.ringCenter}>
            <AppText variant="label">Saved</AppText>
            <AppText variant="hero" style={styles.ringAmount}>{formatEuro(goal.totalSaved, false)}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {goal.targetAmount ? `${pct}% of ${formatEuro(goal.targetAmount)}` : 'Open-ended'}
            </AppText>
          </View>
        </ProgressRing>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(120)}>
        <GlassCard padding={spacing.lg}>
          <Stat label="Per month" value={formatEuro(goal.debitAmount)} />
          <Divider />
          <Stat label="Debit day" value={`Day ${goal.debitDay} of each month`} />
          <Divider />
          <Stat label="Window" value={`${fmtDate(goal.startDate)} → ${fmtDate(goal.endDate)}`} />
          {remaining !== null && (
            <>
              <Divider />
              <Stat label="Remaining" value={formatEuro(remaining)} accent />
            </>
          )}
        </GlassCard>
      </Animated.View>

      <View style={styles.actions}>
        {goal.status === 'Active' && (
          <GradientButton label="Pause" variant="ghost" loading={pause.isPending} disabled={busy}
            onPress={() => pause.mutate(id)} />
        )}
        {goal.status === 'Paused' && (
          <GradientButton label="Resume" loading={resume.isPending} disabled={busy}
            onPress={() => resume.mutate(id)} />
        )}
        {(goal.status === 'Active' || goal.status === 'Paused') && (
          <GradientButton label="Cancel goal" variant="danger" disabled={busy} onPress={confirmCancel} />
        )}
      </View>

      <View style={styles.txHeader}>
        <AppText variant="title">Activity</AppText>
        {!!(transactions && transactions.length) && (
          <AppText variant="h2" color={colors.gold} onPress={() => router.push(`/(app)/goal/${id}/transactions`)}>
            See all
          </AppText>
        )}
      </View>

      {recent.length === 0 ? (
        <EmptyState glyph="↻" title="No activity yet" subtitle="Debits will appear here once collection begins." />
      ) : (
        <GlassCard padding={spacing.xs}>
          {recent.map((tx, i) => (
            <TransactionRow key={tx.id} tx={tx} last={i === recent.length - 1} />
          ))}
        </GlassCard>
      )}
    </Screen>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.statRow}>
      <AppText variant="bodyMuted">{label}</AppText>
      <AppText variant="mono" color={accent ? colors.gold : colors.textPrimary}>{value}</AppText>
    </View>
  );
}

const Divider = () => <View style={styles.divider} />;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: '2-digit' });
}

const styles = StyleSheet.create({
  ringWrap: { alignItems: 'center', marginVertical: spacing.lg },
  ringCenter: { alignItems: 'center', gap: 2 },
  ringAmount: { fontSize: 42 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
  actions: { gap: spacing.md, marginTop: spacing.lg },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing['2xl'], marginBottom: spacing.base },
});
