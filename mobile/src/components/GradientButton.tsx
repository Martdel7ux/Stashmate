import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Platform } from 'react-native';
import { AppText } from './AppText';
import { colors, gradients, radius, shadow, spacing } from '@/theme';

interface GradientButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gold' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GradientButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'gold',
  icon,
  style,
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isDisabled = disabled || loading;

  const press = () => {
    if (isDisabled) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator color={variant === 'gold' ? colors.textOnGold : colors.textPrimary} />
      ) : (
        <>
          {icon}
          <AppText
            variant="h2"
            color={variant === 'gold' ? colors.textOnGold : variant === 'danger' ? colors.danger : colors.textPrimary}
            style={styles.label}
          >
            {label}
          </AppText>
        </>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={press}
      onPressIn={() => (scale.value = withSpring(0.97, { damping: 18, stiffness: 320 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 18, stiffness: 320 }))}
      disabled={isDisabled}
      style={[animatedStyle, variant === 'gold' && shadow.gold, isDisabled && styles.disabled, style]}
    >
      {variant === 'gold' ? (
        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.surface}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.surface, variant === 'danger' ? styles.dangerSurface : styles.ghostSurface]}>
          {content}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  ghostSurface: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dangerSurface: {
    backgroundColor: colors.dangerSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(224,115,94,0.4)',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { letterSpacing: 0.2 },
  disabled: { opacity: 0.5 },
});
