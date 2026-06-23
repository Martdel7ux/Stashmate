import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';
import { colors, formatEuro, radius, spacing } from '@/theme';
import type { Goal } from '@/api/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GoalCard({ goal, onPress }: { goal: Goal; onPress?: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const progress = goal.targetAmount && goal.targetAmount > 0 ? goal.totalSaved / goal.targetAmount : 0;
  const pct = Math.round(Math.min(1, progress) * 100);

  const press = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={press}
      onPressIn={() => (scale.value = withSpring(0.98, { damping: 20, stiffness: 320 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 20, stiffness: 320 }))}
      style={animatedStyle}
    >
      <GlassCard padding={spacing.lg}>
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['rgba(235,210,160,0.22)', 'rgba(181,134,58,0.10)']}
              style={StyleSheet.absoluteFill}
            />
            <AppText style={styles.icon}>{emojiFor(goal.name)}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h2" numberOfLines={1}>{goal.name}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {formatEuro(goal.debitAmount)} / mo · day {goal.debitDay}
            </AppText>
          </View>
          <StatusBadge status={goal.status} />
        </View>

        <View style={styles.amountRow}>
          <AppText variant="title" style={styles.saved}>{formatEuro(goal.totalSaved)}</AppText>
          {goal.targetAmount ? (
            <AppText variant="caption" color={colors.textMuted}>
              of {formatEuro(goal.targetAmount)}
            </AppText>
          ) : (
            <AppText variant="caption" color={colors.textMuted}>open-ended</AppText>
          )}
        </View>

        {goal.targetAmount ? (
          <View style={styles.progressRow}>
            <ProgressBar progress={progress} />
            <AppText variant="caption" color={colors.gold} style={styles.pct}>{pct}%</AppText>
          </View>
        ) : null}
      </GlassCard>
    </AnimatedPressable>
  );
}

function emojiFor(name: string): string {
  const n = name.toLowerCase();
  if (/(france|paris|trip|travel|holiday|flight)/.test(n)) return '✈️';
  if (/(car|tesla|vehicle)/.test(n)) return '🚗';
  if (/(house|home|deposit|flat|rent)/.test(n)) return '🏡';
  if (/(laptop|mac|pc|phone|tech)/.test(n)) return '💻';
  if (/(wedding|ring)/.test(n)) return '💍';
  if (/(baby|kid)/.test(n)) return '🍼';
  if (/(emergency|rainy|safety)/.test(n)) return '🛟';
  return '✦';
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  icon: { fontSize: 20 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.lg },
  saved: { fontSize: 22 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  pct: { width: 38, textAlign: 'right' },
});
