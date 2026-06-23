import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, spacing, gradients } from '@/theme';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
  intensity?: number;
  /** Adds a warm gold edge highlight (used for the hero / featured cards). */
  featured?: boolean;
}

/**
 * Frosted translucent card. A BlurView provides the frost; a faint diagonal
 * gradient + hairline border give it the layered, premium edge.
 * Web falls back to a translucent surface (BlurView blur is limited there).
 */
export function GlassCard({
  children,
  style,
  padding = spacing.lg,
  intensity = 28,
  featured = false,
}: GlassCardProps) {
  return (
    <View style={[styles.shadow, shadow.card, style]}>
      <View style={[styles.clip, featured && styles.featuredBorder]}>
        <BlurView
          intensity={Platform.OS === 'web' ? 0 : intensity}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={gradients.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {featured && (
          <LinearGradient
            colors={['rgba(235,210,160,0.18)', 'rgba(235,210,160,0.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0.7 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={{ padding }}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: radius.lg },
  clip: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTranslucent,
  },
  featuredBorder: {
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
});
