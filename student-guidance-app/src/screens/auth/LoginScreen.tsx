import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { colors, spacing, typography, radii } from '../../theme';
import { logIn } from '../../storage/auth';
import { useAppState } from '../../state/appState';

type Props = NativeStackScreenProps<any>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { refresh } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    try {
      setIsSubmitting(true);
      await logIn(email, password);
      await refresh();
      const root = navigation.getParent<any>();
      root?.reset({ index: 0, routes: [{ name: 'Career' }] });
    } catch (e: any) {
      Alert.alert('Login failed', e.message ?? 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Pick up where you left off.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <Pressable
          onPress={() => setShowPassword((prev) => !prev)}
          style={styles.togglePassword}
        >
          <Text style={styles.togglePasswordText}>
            {showPassword ? 'Hide password' : 'Show password'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || isSubmitting) && { opacity: 0.9 },
          ]}
          disabled={isSubmitting}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryLabel}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Signup')} style={styles.footerLink}>
          <Text style={styles.footerText}>New here? Create an account</Text>
        </Pressable>
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.meta,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  togglePassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  togglePasswordText: {
    ...typography.meta,
    color: colors.accent,
  },
  primaryButton: {
    backgroundColor: colors.primaryGradientStart,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  footerLink: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    ...typography.meta,
    color: colors.textMuted,
  },
});

