import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppText } from './AppText';
import { colors, radius, shadow, spacing } from '@/theme';

const GLYPHS: Record<string, string> = { index: '◇', wallet: '▣' };
const LABELS: Record<string, string> = { index: 'Goals', wallet: 'Wallet' };

/** Floating frosted-glass tab bar. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + spacing.sm }]} pointerEvents="box-none">
      <View style={[styles.bar, shadow.card]}>
        <BlurView intensity={Platform.OS === 'web' ? 0 : 40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.barInner}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const onPress = () => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tab}>
                <AppText style={[styles.glyph, { color: focused ? colors.gold : colors.textMuted }]}>
                  {GLYPHS[route.name] ?? '○'}
                </AppText>
                <AppText
                  variant="caption"
                  color={focused ? colors.textPrimary : colors.textMuted}
                  style={styles.label}
                >
                  {LABELS[route.name] ?? route.name}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  bar: {
    width: 200,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTranslucentStrong,
  },
  barInner: { flexDirection: 'row', paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  glyph: { fontSize: 18, lineHeight: 22 },
  label: { fontSize: 11 },
});
