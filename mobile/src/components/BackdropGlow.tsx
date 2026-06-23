import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';

/**
 * Warm ambient backdrop: a soft champagne glow bleeding down from the top of the
 * screen into the obsidian canvas. Two stacked gradients fake a radial falloff.
 */
export function BackdropGlow({ style }: { style?: ViewStyle }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, style]} pointerEvents="none">
      <LinearGradient
        colors={[colors.bgGlowTop, 'rgba(20,16,11,0.0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(212,175,110,0.10)', 'rgba(212,175,110,0.0)']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
