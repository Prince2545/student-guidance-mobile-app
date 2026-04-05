import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, radii, spacing, typography } from '../../theme';
import { savePhase3Answer } from '../../storage/careerDiscovery';
import { useAppState } from '../../state/appState';

type Props = NativeStackScreenProps<any>;

export const CareerPhaseThreeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAppState();
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');

  const countWords = (value: string) =>
    value
      .trim()
      .split(/\s+/g)
      .filter(Boolean).length;

  const wc1 = useMemo(() => countWords(q1), [q1]);
  const wc2 = useMemo(() => countWords(q2), [q2]);
  const wc3 = useMemo(() => countWords(q3), [q3]);

  const minWords = 20;
  const canContinue = wc1 >= minWords && wc2 >= minWords && wc3 >= minWords;

  const onContinue = async () => {
    if (!user) return;
    await savePhase3Answer({
      userId: user.id,
      q1,
      q2,
      q3,
    });
    navigation.navigate('Result');
  };

  return (
    <ScreenContainer>
      <Text style={styles.stepLabel}>Phase 3 of 4</Text>
      <Text style={styles.title}>Deep dive reflections</Text>
      <Text style={styles.subtitle}>Answer each question with at least 20 words.</Text>

      <Card style={styles.card}>
        <View style={styles.block}>
          <Text style={styles.prompt}>Why are you interested in this kind of work or field?</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe where your curiosity comes from..."
            placeholderTextColor={colors.textMuted}
            value={q1}
            onChangeText={setQ1}
            multiline
            textAlignVertical="top"
          />
          <Text style={wc1 >= minWords ? styles.counterOk : styles.counter}>
            {wc1}/{minWords} words
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.prompt}>What problems do you want to help solve in the future?</Text>
          <TextInput
            style={styles.input}
            placeholder="Think about issues at school, in your community, or the world..."
            placeholderTextColor={colors.textMuted}
            value={q2}
            onChangeText={setQ2}
            multiline
            textAlignVertical="top"
          />
          <Text style={wc2 >= minWords ? styles.counterOk : styles.counter}>
            {wc2}/{minWords} words
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.prompt}>What kind of life and work do you imagine for yourself?</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe the kind of day-to-day work, people, and impact you want..."
            placeholderTextColor={colors.textMuted}
            value={q3}
            onChangeText={setQ3}
            multiline
            textAlignVertical="top"
          />
          <Text style={wc3 >= minWords ? styles.counterOk : styles.counter}>
            {wc3}/{minWords} words
          </Text>
        </View>

        <Pressable
          disabled={!canContinue}
          onPress={onContinue}
          style={({ pressed }) => [
            styles.primaryButton,
            !canContinue && { opacity: 0.45 },
            pressed && canContinue && { transform: [{ scale: 0.99 }] },
          ]}
        >
          <Text style={styles.primaryLabel}>See recommendation</Text>
        </Pressable>
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  stepLabel: {
    ...typography.meta,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.lg,
  },
  block: {
    marginBottom: spacing.lg,
  },
  prompt: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 160,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  counter: {
    ...typography.meta,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  counterOk: {
    ...typography.meta,
    color: colors.success,
    marginBottom: spacing.md,
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
});

// Note: keep this file self-contained for quick iteration.

