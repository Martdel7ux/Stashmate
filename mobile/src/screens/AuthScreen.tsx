import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Field } from '@/components/Field';
import { GradientButton } from '@/components/GradientButton';
import { Logo } from '@/components/Logo';
import { useLogin, useRegister } from '@/api/auth';
import { ApiError } from '@/api/client';
import { colors, spacing } from '@/theme';

export function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const login = useLogin();
  const register = useRegister();
  const pending = login.isPending || register.isPending;

  const submit = async () => {
    setError(null);
    try {
      if (isLogin) await login.mutateAsync({ email: email.trim(), password });
      else await register.mutateAsync({ email: email.trim(), password });
      router.replace('/(app)');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.top}>
          <Animated.View entering={FadeIn.duration(600)}>
            <Logo />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(600).delay(120)} style={styles.headline}>
            <AppText variant="display">
              {isLogin ? 'Welcome back.' : 'Save on autopilot.'}
            </AppText>
            <AppText variant="bodyMuted" style={styles.sub}>
              {isLogin
                ? 'Sign in to keep your goals growing.'
                : 'Set a goal, pick an amount, and let it build itself.'}
            </AppText>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.duration(600).delay(220)} style={styles.form}>
          <Field
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Password"
            placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error && (
            <Animated.View entering={FadeIn}>
              <AppText variant="caption" color={colors.danger}>{error}</AppText>
            </Animated.View>
          )}
          <GradientButton
            label={isLogin ? 'Sign in' : 'Create account'}
            onPress={submit}
            loading={pending}
            disabled={!email || !password}
            style={styles.cta}
          />
          <View style={styles.switchRow}>
            <AppText variant="bodyMuted">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </AppText>
            <AppText
              variant="h2"
              color={colors.gold}
              onPress={() => router.replace(isLogin ? '/(auth)/register' : '/(auth)/login')}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </AppText>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'space-between', paddingBottom: spacing.xl },
  top: { paddingTop: spacing['3xl'], gap: spacing['2xl'] },
  headline: { gap: spacing.sm },
  sub: { maxWidth: 300 },
  form: { gap: spacing.base },
  cta: { marginTop: spacing.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
});
