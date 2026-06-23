import { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './AppText';
import { colors, fontFamily, fontSize, radius, spacing } from '@/theme';

interface FieldProps extends TextInputProps {
  label?: string;
  prefix?: string;
  error?: string;
}

export function Field({ label, prefix, error, style, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label && <AppText variant="label" style={styles.label}>{label}</AppText>}
      <View
        style={[
          styles.inputWrap,
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        {prefix && <AppText variant="title" color={colors.gold} style={styles.prefix}>{prefix}</AppText>}
        <TextInput
          {...rest}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.gold}
          style={[styles.input, style]}
        />
      </View>
      {error && <AppText variant="caption" color={colors.danger} style={styles.error}>{error}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: { marginLeft: spacing.xs },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    minHeight: 56,
    gap: spacing.sm,
  },
  focused: { borderColor: colors.borderStrong, backgroundColor: colors.surfaceElevated },
  errored: { borderColor: 'rgba(224,115,94,0.5)' },
  prefix: { fontSize: fontSize.lg },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    paddingVertical: spacing.base,
  },
  error: { marginLeft: spacing.xs },
});
