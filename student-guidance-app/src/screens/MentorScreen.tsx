import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { colors, radii, spacing, typography } from '../theme';
import { useAppState } from '../state/appState';
import { getCareerById } from '../utils/careers';
import { AI_API_FRIENDLY_ERROR, sendMessageToAI } from '../api/apiClient';

type Message = { id: string; role: 'mentor' | 'user'; text: string; at: string };

function buildContextualHint(
  userMessage: string,
  params: {
    careerTitle?: string;
    careerClusterId: string | null;
    completedTaskCount: number;
    hasCompletedCareerDiscovery: boolean;
  },
): string | undefined {
  if (
    !/\b(task|tasks|progress|career|today|unlock|streak|level|xp|my work|mentor)\b/i.test(
      userMessage,
    )
  ) {
    return undefined;
  }
  return [
    params.careerClusterId
      ? `Learning cluster id: ${params.careerClusterId}`
      : 'No learning cluster id in app yet.',
    params.careerTitle ? `Cluster theme: ${params.careerTitle}` : null,
    `Completed tasks count (from app): ${params.completedTaskCount}`,
    `Career discovery completed: ${params.hasCompletedCareerDiscovery}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function MentorScreen() {
  const {
    user,
    incrementMentorActivity,
    recommendedCareerId,
    completedTasks,
    hasCompletedCareerDiscovery,
  } = useAppState();
  const listRef = useRef<FlatList<Message> | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      role: 'mentor',
      text: 'Welcome! When you complete tasks, I’ll help you plan what to do next.',
      at: new Date().toISOString(),
    },
  ]);

  const userName = user?.name?.split(' ')[0] ?? 'there';
  const careerTitle = useMemo(() => {
    if (!recommendedCareerId) return undefined;
    return getCareerById(recommendedCareerId)?.title;
  }, [recommendedCareerId]);
  const completedTaskCount = completedTasks.length;
  const [draft, setDraft] = useState('');
  const [sendingAi, setSendingAi] = useState(false);
  const sendingAiRef = useRef(false);

  const quickReplies = useMemo(
    () => [
      { id: 'stuck', label: "I’m stuck", icon: 'alert-circle-outline' as const },
      { id: 'improve', label: 'How to improve?', icon: 'trending-up-outline' as const },
      { id: 'next', label: "What’s next?", icon: 'arrow-forward-outline' as const },
    ],
    [],
  );

  const sendCanned = (id: string) => {
    const now = new Date().toISOString();
    const mentorText =
      id === 'stuck'
        ? `No worries, ${userName}. Tell me where you got stuck, and we’ll break the next step into something tiny.`
        : id === 'improve'
          ? `For improvement, focus on one skill at a time: do a quick recap, then try the task again with a checklist.`
          : `Next, you’ll want to complete today’s task and upload proof so your cooldown unlocks tomorrow.`;

    setMessages((prev) => [
      ...prev,
      { id: `u-${now}`, role: 'user', text: quickReplies.find((q) => q.id === id)?.label ?? '', at: now },
      { id: `m-${now}`, role: 'mentor', text: mentorText, at: now },
    ]);
    void incrementMentorActivity(1);
  };

  const sendUserMessage = async () => {
    const text = draft.trim();
    if (!text || sendingAiRef.current) return;
    sendingAiRef.current = true;
    const userId = `u-free-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userId, role: 'user', text, at: new Date().toISOString() }]);
    setDraft('');
    void incrementMentorActivity(1);
    setSendingAi(true);
    try {
      const contextualHint = buildContextualHint(text, {
        careerTitle,
        careerClusterId: recommendedCareerId,
        completedTaskCount,
        hasCompletedCareerDiscovery,
      });
      const reply = await sendMessageToAI(text, { contextualHint });
      const mid = `m-ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: mid, role: 'mentor', text: reply, at: new Date().toISOString() },
      ]);
    } catch {
      const eid = `m-err-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: eid,
          role: 'mentor',
          text: AI_API_FRIENDLY_ERROR,
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      sendingAiRef.current = false;
      setSendingAi(false);
    }
  };

  return (
    <ScreenContainer scrollable={false} contentContainerStyle={styles.screenContent}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 72 : 0}
      >
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Ionicons name="hardware-chip-outline" size={20} color={colors.accent} />
            <Text style={styles.headerTitle}>AI Mentor</Text>
          </View>
        </Card>

        <View style={styles.chatShell}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              sendingAi ? (
                <View style={styles.typingRow}>
                  <ActivityIndicator size="small" color={colors.textMuted} />
                  <Text style={styles.typingText}>Thinking…</Text>
                </View>
              ) : null
            }
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item: m }) => (
              <View style={[styles.bubbleRow, m.role === 'user' && { justifyContent: 'flex-end' }]}>
                <View style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.mentorBubble]}>
                  <Text style={[styles.bubbleText, m.role === 'user' ? styles.userText : styles.mentorText]}>
                    {m.text}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>

        <View style={styles.quickReplies}>
          {quickReplies.map((q) => (
            <Pressable
              key={q.id}
              onPress={() => sendCanned(q.id)}
              disabled={sendingAi}
              style={({ pressed }) => [
                styles.quickChip,
                (pressed || sendingAi) && { opacity: 0.6 },
                pressed && !sendingAi && { transform: [{ scale: 0.99 }], opacity: 0.9 },
              ]}
            >
              <View style={styles.quickChipInner}>
                <Ionicons name={q.icon} size={14} color={colors.accent} />
                <Text style={styles.quickChipText}>{q.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            onFocus={() => listRef.current?.scrollToEnd({ animated: true })}
            returnKeyType="send"
            onSubmitEditing={() => void sendUserMessage()}
            editable={!sendingAi}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              (pressed || sendingAi) && { opacity: 0.85 },
              sendingAi && { opacity: 0.6 },
            ]}
            onPress={() => void sendUserMessage()}
            disabled={sendingAi}
          >
            {sendingAi ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Ionicons name="send" size={16} color={colors.textPrimary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingBottom: spacing.xl,
  },
  kav: {
    flex: 1,
  },
  headerCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  chatShell: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: 'rgba(15,23,42,0.35)',
    marginBottom: spacing.md,
    minHeight: 240,
  },
  chatList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '84%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  mentorBubble: {
    backgroundColor: 'rgba(124,58,237,0.14)',
    borderColor: 'rgba(124,58,237,0.35)',
  },
  userBubble: {
    backgroundColor: 'rgba(34,211,238,0.12)',
    borderColor: 'rgba(34,211,238,0.35)',
  },
  bubbleText: {
    ...typography.body,
    lineHeight: 20,
  },
  mentorText: {
    color: colors.textSecondary,
  },
  userText: {
    color: colors.textPrimary,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  quickChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickChipText: {
    ...typography.meta,
    color: colors.accent,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  input: {
    flex: 1,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryGradientStart,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  typingText: {
    ...typography.meta,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});

