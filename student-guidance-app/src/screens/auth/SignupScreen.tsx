import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { colors, spacing, typography, radii } from '../../theme';
import { signUp } from '../../storage/auth';
import { useAppState } from '../../state/appState';

type Props = NativeStackScreenProps<any>;

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { refresh } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What inspires you the most?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password || !securityAnswer.trim()) {
      Alert.alert('Missing info', 'Please fill all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password should be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    try {
      setIsSubmitting(true);
      await signUp({ name, email, password, securityQuestion, securityAnswer });
      await refresh();
      const root = navigation.getParent<any>();
      root?.reset({ index: 0, routes: [{ name: 'Career' }] });
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message ?? 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>We’ll use this to save your journey.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Priya Sharma"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

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

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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

        <View style={styles.field}>
          <Text style={styles.label}>Security Question</Text>
          <Text style={styles.securityQuestion}>{securityQuestion}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Your Answer</Text>
          <TextInput
            style={styles.input}
            placeholder="Short answer you'll remember"
            placeholderTextColor={colors.textMuted}
            value={securityAnswer}
            onChangeText={setSecurityAnswer}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || isSubmitting) && { opacity: 0.9 },
          ]}
          disabled={isSubmitting}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryLabel}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.footerLink}>
          <Text style={styles.footerText}>Already have an account? Log in</Text>
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
    marginBottom: spacing.md,
  },
  togglePasswordText: {
    ...typography.meta,
    color: colors.accent,
  },
  securityQuestion: {
    ...typography.body,
    color: colors.textSecondary,
  },
  primaryButton: {
    marginTop: spacing.lg,
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

