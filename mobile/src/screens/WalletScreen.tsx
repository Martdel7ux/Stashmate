import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { Logo } from '@/components/Logo';
import { EmptyState } from '@/components/EmptyState';
import { useWallet } from '@/api/wallet';
import { useGoals } from '@/api/goals';
import { colors, formatEuro, gradients, radius, shadow, spacing } from '@/theme';

export function WalletScreen() {
  const { data: wallet, refetch, isRefetching } = useWallet();
  const { data: goals } = useGoals();

  const breakdown = (goals ?? []).filter((g) => g.totalSaved > 0);
  const localTotal = (goals ?? []).reduce((s, g) => s + g.totalSaved, 0);
  const balance = wallet?.balance ?? localTotal;

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <Header title="Wallet" subtitle="Your virtual IBAN" />

      {/* Premium card face */}
      <Animated.View entering={FadeIn.duration(600)} style={[styles.cardShadow, shadow.gold]}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <LinearGradient
            colors={['rgba(235,210,160,0.16)', 'rgba(235,210,160,0)']}
            start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0.8 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardTop}>
            <Logo size="sm" />
            <AppText variant="label" color={colors.gold}>e-money</AppText>
          </View>
          <View>
            <AppText variant="label">Available balance</AppText>
            <AppText variant="hero" style={styles.balance}>{formatEuro(balance)}</AppText>
          </View>
          <View style={styles.cardBottom}>
            <View>
              <AppText variant="label">Account</AppText>
              <AppText variant="mono" color={colors.textSecondary} style={styles.iban}>
                {wallet?.swanAccountId ? mask(wallet.swanAccountId) : '•••• •••• ••••'}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textMuted}>{wallet?.currency ?? 'EUR'}</AppText>
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.section}>
        <AppText variant="title">By goal</AppText>
      </View>

      {breakdown.length === 0 ? (
        <EmptyState glyph="✦" title="Nothing saved yet" subtitle="Your wallet fills up automatically as debits are collected." />
      ) : (
        <GlassCard padding={spacing.xs}>
          {breakdown.map((g, i) => (
            <Animated.View key={g.id} entering={FadeInDown.duration(450).delay(60 * i)}>
              <View style={[styles.row, i < breakdown.length - 1 && styles.rowBorder]}>
                <AppText variant="h2" onPress={() => router.push(`/(app)/goal/${g.id}`)}>{g.name}</AppText>
                <AppText variant="mono" color={colors.gold}>{formatEuro(g.totalSaved)}</AppText>
              </View>
            </Animated.View>
          ))}
        </GlassCard>
      )}

      <AppText variant="caption" color={colors.textMuted} style={styles.note}>
        Withdrawals are coming soon. For now, funds stay safely in your wallet.
      </AppText>
    </Screen>
  );
}

function mask(id: string): string {
  const tail = id.slice(-4).toUpperCase();
  return `•••• •••• ${tail}`;
}

const styles = StyleSheet.create({
  cardShadow: { borderRadius: radius.xl },
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: spacing.xl,
    height: 220,
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balance: { fontSize: 44, marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  iban: { letterSpacing: 2, marginTop: 2 },
  section: { marginTop: spacing['2xl'], marginBottom: spacing.base },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.base, paddingHorizontal: spacing.md },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  note: { marginTop: spacing.lg, textAlign: 'center' },
});
