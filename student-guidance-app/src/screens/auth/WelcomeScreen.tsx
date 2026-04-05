import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { colors, spacing, typography, radii } from '../../theme';

type Props = NativeStackScreenProps<any>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.appName}>Student Guidance System</Text>
        <Text style={styles.tagline}>Discover. Learn. Build. Achieve.</Text>
      </View>

      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>Turn your curiosity into a career.</Text>
        <Text style={styles.heroSubtitle}>
          Get a guided path with daily tasks, mentor-style tips, and a real portfolio.
        </Text>
      </Card>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.primaryLabel}>Get Started</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryLabel}>I already have an account</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing['2xl'],
  },
  appName: {
    ...typography.heading1,
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.subtitle,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  heroCard: {
    marginBottom: spacing['2xl'],
  },
  heroTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: 'auto',
  },
  primaryButton: {
    backgroundColor: colors.primaryGradientStart,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  primaryLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  secondaryButton: {
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
});

