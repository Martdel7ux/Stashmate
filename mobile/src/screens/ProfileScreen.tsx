import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/api/auth';
import { colors, gradients, radius, shadow, spacing } from '@/theme';

export function ProfileScreen() {
  const email = useAuthStore((s) => s.session?.email ?? '');
  const logout = useLogout();

  const initial = email.charAt(0).toUpperCase() || 'U';

  const signOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Screen>
      <Header onBack title="Account" subtitle="Profile" />

      <Animated.View entering={FadeInDown.duration(500)} style={styles.identity}>
        <View style={[styles.avatar, shadow.gold]}>
          <LinearGradient colors={gradients.gold} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <AppText variant="display" color={colors.textOnGold}>{initial}</AppText>
        </View>
        <AppText variant="title">{email || 'Your account'}</AppText>
        <AppText variant="caption" color={colors.textMuted}>SEPA · EUR</AppText>
      </Animated.View>

      <GlassCard padding={spacing.xs} style={styles.menu}>
        <Row label="Email" value={email} />
        <Row label="Region" value="European Union" />
        <Row label="Mandate" value="SEPA Direct Debit" last />
      </GlassCard>

      <GradientButton label="Sign out" variant="danger" onPress={signOut} style={styles.signout} />

      <AppText variant="caption" color={colors.textMuted} style={styles.version}>
        Stash · v1.0.0
      </AppText>
    </Screen>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <AppText variant="bodyMuted">{label}</AppText>
      <AppText variant="h2" numberOfLines={1} style={styles.rowValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  avatar: {
    width: 84, height: 84, borderRadius: 42, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  menu: { marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.base, paddingHorizontal: spacing.base, gap: spacing.base },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  signout: { marginTop: spacing.xl },
  version: { textAlign: 'center', marginTop: spacing.xl },
});
