import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackdropGlow } from '@/components/BackdropGlow';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Header } from '@/components/Header';
import { AppText } from '@/components/AppText';
import { Field } from '@/components/Field';
import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { useCreateGoal } from '@/api/goals';
import { ApiError } from '@/api/client';
import { colors, radius, spacing } from '@/theme';

const DURATIONS = [
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
  { label: '2 years', months: 24 },
  { label: '5 years', months: 60 },
];

export function CreateGoalScreen() {
  const [name, setName] = useState('');
  const [monthly, setMonthly] = useState('');
  const [target, setTarget] = useState('');
  const [day, setDay] = useState(1);
  const [months, setMonths] = useState(12);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateGoal();

  const { startDate, endDate } = useMemo(() => {
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return { startDate: start, endDate: end };
  }, [months]);

  const monthlyNum = parseFloat(monthly.replace(',', '.'));
  const valid = name.trim().length > 0 && monthlyNum > 0;

  const submit = async () => {
    setError(null);
    try {
      await create.mutateAsync({
        name: name.trim(),
        targetAmount: target ? parseFloat(target.replace(',', '.')) : null,
        debitAmount: monthlyNum,
        debitDay: day,
        startDate: toDateOnly(startDate),
        endDate: toDateOnly(endDate),
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create the goal. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <BackdropGlow />
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Header onBack subtitle="New goal" title="What are you saving for?" />

            <Animated.View entering={FadeInDown.duration(500)} style={styles.form}>
              <Field label="Goal name" placeholder="Trip to France" value={name} onChangeText={setName} maxLength={60} />

              <View style={styles.row}>
                <View style={styles.flex}>
                  <Field label="Per month" prefix="€" placeholder="50" keyboardType="decimal-pad" value={monthly} onChangeText={setMonthly} />
                </View>
                <View style={styles.flex}>
                  <Field label="Target (optional)" prefix="€" placeholder="1,200" keyboardType="decimal-pad" value={target} onChangeText={setTarget} />
                </View>
              </View>

              <View style={styles.block}>
                <AppText variant="label" style={styles.blockLabel}>Debit day</AppText>
                <GlassCard padding={spacing.base}>
                  <View style={styles.stepper}>
                    <StepBtn glyph="−" onPress={() => setDay((d) => Math.max(1, d - 1))} />
                    <View style={styles.dayValue}>
                      <AppText variant="display">{day}</AppText>
                      <AppText variant="caption" color={colors.textMuted}>of each month</AppText>
                    </View>
                    <StepBtn glyph="+" onPress={() => setDay((d) => Math.min(28, d + 1))} />
                  </View>
                  <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
                    Capped at 28 so collection works every month.
                  </AppText>
                </GlassCard>
              </View>

              <View style={styles.block}>
                <AppText variant="label" style={styles.blockLabel}>Duration</AppText>
                <View style={styles.chips}>
                  {DURATIONS.map((d) => {
                    const active = d.months === months;
                    return (
                      <Pressable
                        key={d.months}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.selectionAsync();
                          setMonths(d.months);
                        }}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <AppText variant="caption" color={active ? colors.textOnGold : colors.textSecondary}>
                          {d.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
                <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
                  Runs until {endDate.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}.
                </AppText>
              </View>

              {error && <AppText variant="caption" color={colors.danger}>{error}</AppText>}
            </Animated.View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton label="Create goal" onPress={submit} loading={create.isPending} disabled={!valid} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function StepBtn({ glyph, onPress }: { glyph: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}
    >
      <AppText variant="title" color={colors.gold}>{glyph}</AppText>
    </Pressable>
  );
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  form: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  block: { gap: spacing.sm },
  blockLabel: { marginLeft: spacing.xs },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    width: 52, height: 52, borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dayValue: { alignItems: 'center' },
  hint: { marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
});
