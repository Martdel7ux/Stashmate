import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { TransactionRow } from '@/components/TransactionRow';
import { EmptyState } from '@/components/EmptyState';
import { useGoal, useTransactions } from '@/api/goals';
import { colors, formatEuro, spacing } from '@/theme';

export function TransactionHistoryScreen({ id }: { id: string }) {
  const { data: goal } = useGoal(id);
  const { data: transactions, isLoading, refetch, isRefetching } = useTransactions(id);

  const list = transactions ?? [];
  const collected = list.filter((t) => t.status === 'Success').reduce((s, t) => s + t.amount, 0);

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <Header onBack subtitle={goal?.name ?? 'Goal'} title="Activity" />

      {!isLoading && list.length > 0 && (
        <Animated.View entering={FadeInDown.duration(500)}>
          <GlassCard featured padding={spacing.lg} style={styles.summary}>
            <View>
              <AppText variant="label">Collected</AppText>
              <AppText variant="title" style={styles.amount}>{formatEuro(collected)}</AppText>
            </View>
            <View style={styles.summaryRight}>
              <AppText variant="label">Debits</AppText>
              <AppText variant="title" style={styles.amount}>{list.length}</AppText>
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {isLoading ? (
        <AppText variant="bodyMuted">Loading…</AppText>
      ) : list.length === 0 ? (
        <EmptyState glyph="↻" title="No activity yet" subtitle="Once collection starts, every debit attempt shows up here." />
      ) : (
        <GlassCard padding={spacing.xs}>
          {list.map((tx, i) => (
            <TransactionRow key={tx.id} tx={tx} last={i === list.length - 1} />
          ))}
        </GlassCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  summaryRight: { alignItems: 'flex-end' },
  amount: { fontSize: 24, marginTop: 2 },
});
