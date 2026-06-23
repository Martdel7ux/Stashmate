import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { spacing } from '@/theme';

export function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title?: string;
  subtitle?: string;
  onBack?: (() => void) | boolean;
  right?: React.ReactNode;
}) {
  const showBack = onBack !== undefined && onBack !== false;
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {showBack && (
          <IconButton
            glyph="‹"
            onPress={() => (typeof onBack === 'function' ? onBack() : router.back())}
          />
        )}
        {title && (
          <View>
            {subtitle && <AppText variant="label">{subtitle}</AppText>}
            <AppText variant="title">{title}</AppText>
          </View>
        )}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginBottom: spacing.lg,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
