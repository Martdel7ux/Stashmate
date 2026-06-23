import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './AppText';
import { colors, gradients, radius, shadow, spacing } from '@/theme';

/** Wordmark + gold monogram tile. */
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const tile = size === 'sm' ? 32 : 40;
  return (
    <View style={styles.row}>
      <View style={[styles.tile, { width: tile, height: tile, borderRadius: tile / 3 }, shadow.gold]}>
        <LinearGradient colors={gradients.gold} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <AppText variant="title" color={colors.textOnGold} style={styles.mark}>S</AppText>
      </View>
      <AppText variant="title" style={styles.word}>Stash</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  mark: { fontSize: 20 },
  word: { letterSpacing: -0.5 },
});
