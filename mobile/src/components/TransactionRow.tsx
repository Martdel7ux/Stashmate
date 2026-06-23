import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, formatEuro, radius, spacing } from '@/theme';
import type { Transaction, TransactionStatus } from '@/api/types';

const meta: Record<TransactionStatus, { glyph: string; color: string; bg: string; label: string }> = {
  Success: { glyph: '↑', color: colors.success, bg: colors.successSoft, label: 'Collected' },
  Pending: { glyph: '⋯', color: colors.warning, bg: 'rgba(224,177,90,0.14)', label: 'Pending' },
  Failed: { glyph: '!', color: colors.danger, bg: colors.dangerSoft, label: 'Failed' },
};

export function TransactionRow({ tx, last }: { tx: Transaction; last?: boolean }) {
  const m = meta[tx.status] ?? meta.Pending;
  return (
    <View style={[styles.row, !last && styles.border]}>
      <View style={[styles.icon, { backgroundColor: m.bg }]}>
        <AppText style={[styles.glyph, { color: m.color }]}>{m.glyph}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="h2">{m.label}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {fmtDateTime(tx.createdAt)}{tx.attemptNumber > 1 ? ` · attempt ${tx.attemptNumber}` : ''}
        </AppText>
      </View>
      <AppText variant="mono" color={tx.status === 'Failed' ? colors.textMuted : colors.textPrimary}>
        {tx.status === 'Success' ? '+' : ''}{formatEuro(tx.amount)}
      </AppText>
    </View>
  );
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  icon: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 18, fontWeight: '700' },
});
