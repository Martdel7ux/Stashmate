import { ReactNode } from 'react';
import { ScrollView, View, ViewStyle, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BackdropGlow } from './BackdropGlow';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
  contentStyle,
  refreshing,
  onRefresh,
}: ScreenProps) {
  const padding = padded ? { paddingHorizontal: spacing.lg } : null;

  return (
    <View style={styles.root}>
      <BackdropGlow />
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={edges}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, padding, contentStyle]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={!!refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.gold}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flexContent, padding, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  content: { paddingBottom: spacing['4xl'], paddingTop: spacing.sm },
  flexContent: { flex: 1 },
});
