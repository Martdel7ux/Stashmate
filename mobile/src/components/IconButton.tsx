import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { colors, radius } from '@/theme';

/** Small circular glyph button. Uses a text glyph so we ship zero icon assets. */
export function IconButton({
  glyph,
  onPress,
  size = 44,
  style,
}: {
  glyph: string;
  onPress?: () => void;
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
        style,
      ]}
    >
      <AppText style={styles.glyph}>{glyph}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceTranslucent,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.6, transform: [{ scale: 0.94 }] },
  glyph: { fontSize: 18, color: colors.textPrimary, lineHeight: 22 },
});
