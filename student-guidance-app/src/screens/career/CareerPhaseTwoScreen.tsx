import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, radii, spacing, typography } from '../../theme';
import { savePhase2Answers } from '../../storage/careerDiscovery';
import { useAppState } from '../../state/appState';

type Props = NativeStackScreenProps<any>;

type Option = { id: string; label: string };
type Question = { id: string; prompt: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    prompt: 'What kind of work energizes you the most?',
    options: [
      { id: 'o1', label: 'Solving technical problems or debugging systems' },
      { id: 'o2', label: 'Designing visuals or user experiences' },
      { id: 'o3', label: 'Understanding people and their stories' },
      { id: 'o4', label: 'Working with numbers, data, or analysis' },
    ],
  },
  {
    id: 'q2',
    prompt: 'How do you prefer to solve problems?',
    options: [
      { id: 'o1', label: 'Break them into small, logical steps' },
      { id: 'o2', label: 'Brainstorm lots of creative ideas first' },
      { id: 'o3', label: 'Talk it through with others' },
      { id: 'o4', label: 'Experiment quickly and learn from mistakes' },
    ],
  },
  {
    id: 'q3',
    prompt: 'What kind of collaboration style fits you best?',
    options: [
      { id: 'o1', label: 'Mostly solo, with check-ins when needed' },
      { id: 'o2', label: 'Small, focused team working closely together' },
      { id: 'o3', label: 'Leading or coordinating a larger group' },
      { id: 'o4', label: 'I enjoy both solo and team work equally' },
    ],
  },
  {
    id: 'q4',
    prompt: 'Which of these sounds closest to your interest?',
    options: [
      { id: 'o1', label: 'Building or securing technical systems' },
      { id: 'o2', label: 'Designing interfaces, visuals, or stories' },
      { id: 'o3', label: 'Understanding markets, business, or money' },
      { id: 'o4', label: 'Exploring science, research, or healthcare' },
    ],
  },
  {
    id: 'q5',
    prompt: 'How do you usually handle a tough challenge?',
    options: [
      { id: 'o1', label: 'Research deeply until I understand it' },
      { id: 'o2', label: 'Ask for feedback and different perspectives' },
      { id: 'o3', label: 'Try multiple approaches quickly' },
      { id: 'o4', label: 'Stay patient and keep iterating until it works' },
    ],
  },
];

export const CareerPhaseTwoScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAppState();

  const [answersByQuestionId, setAnswersByQuestionId] = useState<
    Record<
      string,
      {
        optionId: string | null;
        anythingElse?: string;
        skipped?: boolean;
      }
    >
  >({});

  const stepsLabel = useMemo(() => 'Phase 2 of 4', []);

  const setOption = (questionId: string, optionId: string) => {
    setAnswersByQuestionId((prev) => ({
      ...prev,
      [questionId]: { optionId, skipped: false },
    }));
  };

  const setAnythingElse = (questionId: string, text: string) => {
    setAnswersByQuestionId((prev) => ({
      ...prev,
      [questionId]: {
        optionId: prev[questionId]?.optionId ?? null,
        anythingElse: text,
        skipped: prev[questionId]?.skipped ?? false,
      },
    }));
  };

  const skipQuestion = (questionId: string) => {
    setAnswersByQuestionId((prev) => ({
      ...prev,
      [questionId]: { optionId: null, skipped: true, anythingElse: prev[questionId]?.anythingElse },
    }));
  };

  const isAnswered = (questionId: string) => {
    const a = answersByQuestionId[questionId];
    if (!a) return false;
    return Boolean(a.skipped || a.optionId);
  };

  const canContinue = QUESTIONS.every((q) => isAnswered(q.id));

  const onContinue = async () => {
    if (!user) return;
    await savePhase2Answers(user.id, answersByQuestionId);
    navigation.navigate('PhaseThree');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>{stepsLabel}</Text>
      <Text style={styles.subtitle}>Answer each prompt. You can also skip per question.</Text>

      <View style={styles.stack}>
        {QUESTIONS.map((q) => {
          const selectedOptionId = answersByQuestionId[q.id]?.optionId ?? null;
          const skipped = answersByQuestionId[q.id]?.skipped ?? false;
          const anythingElse = answersByQuestionId[q.id]?.anythingElse ?? '';

          return (
            <Card key={q.id} style={styles.card}>
              <Text style={styles.questionPrompt}>{q.prompt}</Text>
              <View style={styles.optionRow}>
                {q.options.map((opt) => {
                  const active = selectedOptionId === opt.id && !skipped;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setOption(q.id, opt.id)}
                      disabled={skipped}
                      style={({ pressed }) => [
                        styles.chip,
                        active && { borderColor: colors.accent, borderWidth: 2 },
                        pressed && { transform: [{ scale: 0.99 }] },
                        skipped && { opacity: 0.5 },
                      ]}
                    >
                      <Text style={[styles.chipLabel, active && { color: colors.textPrimary }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                style={[styles.input, skipped && { opacity: 0.6 }]}
                placeholder="Anything else? (optional)"
                placeholderTextColor={colors.textMuted}
                multiline
                value={anythingElse}
                editable={!skipped}
                onChangeText={(t) => setAnythingElse(q.id, t)}
              />

              <View style={styles.rowBetween}>
                <Pressable
                  onPress={() => skipQuestion(q.id)}
                  style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.skipLabel}>Skip</Text>
                </Pressable>
                <Text style={styles.hint}>{isAnswered(q.id) ? 'Saved' : ' '}</Text>
              </View>
            </Card>
          );
        })}
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
        <Text style={styles.primaryLabel}>Continue</Text>
      </Pressable>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
  stack: {
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  card: {
    paddingVertical: spacing.md,
  },
  questionPrompt: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 120,
  },
  chipLabel: {
    ...typography.meta,
    color: colors.textSecondary,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    minHeight: 54,
    marginBottom: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  skipLabel: {
    ...typography.meta,
    color: colors.warning,
  },
  hint: {
    ...typography.meta,
    color: colors.textMuted,
  },
  primaryButton: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
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

