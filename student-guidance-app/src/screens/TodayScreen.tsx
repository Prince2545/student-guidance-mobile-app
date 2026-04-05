import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { colors, radii, spacing, typography } from '../theme';
import { useAppState } from '../state/appState';
import { getCareerById } from '../utils/careers';
import { getTodayTaskViewModel } from '../utils/taskEngine';
import { attachProofToTaskInstance, markTaskInstanceCompleted } from '../storage/tasks';
import type { TaskProofMediaType } from '../storage/schema';
import { getTipForDate } from '../utils/tips';

const MAX_VIDEO_SECONDS = 60;

export function TodayScreen() {
  const navigation = useNavigation<any>();
  const { user, recommendedCareerId, refreshDashboard, addFocusSeconds, addCompletedTask } = useAppState();

  const [vmLoading, setVmLoading] = useState(true);
  const [taskVm, setTaskVm] = useState<Awaited<ReturnType<typeof getTodayTaskViewModel>> | null>(null);
  const [tickMs, setTickMs] = useState(Date.now());
  const [uploading, setUploading] = useState(false);
  const [isTaskStarted, setIsTaskStarted] = useState(false);
  const [stepChecks, setStepChecks] = useState<Record<string, boolean>>({});
  const [hasTriggeredUnlockRefresh, setHasTriggeredUnlockRefresh] = useState(false);
  const todayFirstFocus = useRef(true);

  const career = useMemo(() => {
    if (!recommendedCareerId) return undefined;
    return getCareerById(recommendedCareerId);
  }, [recommendedCareerId]);

  const greetingName = user?.name?.split(' ')[0] ?? 'Friend';
  const dailyTip = useMemo(() => getTipForDate(), []);

  const userId = user?.id;

  const refresh = useCallback(async () => {
    if (!userId || !recommendedCareerId) return;
    setVmLoading(true);
    try {
      const vm = await getTodayTaskViewModel({ userId, careerId: recommendedCareerId });
      setTaskVm(vm);
    } catch (e: any) {
      Alert.alert('Task error', e?.message ?? 'Something went wrong.');
    } finally {
      setVmLoading(false);
    }
  }, [userId, recommendedCareerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!taskVm?.nextUnlockAt) return;
    const id = setInterval(() => setTickMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [taskVm?.nextUnlockAt]);

  const msRemaining = taskVm?.nextUnlockAt ? Math.max(0, taskVm.nextUnlockAt.getTime() - tickMs) : 0;
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  useEffect(() => {
    setHasTriggeredUnlockRefresh(false);
  }, [taskVm?.nextUnlockAt]);

  // When countdown reaches zero or below while the user stays on Today,
  // immediately refresh so the next task unlocks without manual reload.
  useEffect(() => {
    if (!taskVm?.nextUnlockAt) return;
    if (msRemaining <= 0 && !hasTriggeredUnlockRefresh) {
      setHasTriggeredUnlockRefresh(true);
      void refresh();
    }
  }, [msRemaining, taskVm?.nextUnlockAt, hasTriggeredUnlockRefresh, refresh]);

  const pickProof = async (source: 'camera' | 'library') => {
    if (!user || !recommendedCareerId || !taskVm?.currentInstance) return;
    if (uploading) return;

    try {
      setUploading(true);

      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Camera permission required', 'Enable camera permissions to upload proof.');
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Media permission required', 'Enable media library permissions to upload proof.');
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.All,
              allowsEditing: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.All,
              allowsEditing: false,
            });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Upload failed', 'No file was selected.');
        return;
      }

      const type = asset.type ?? '';
      const inferredMediaType: TaskProofMediaType =
        type.toLowerCase().startsWith('video') ? 'video' : 'image';

      const durationSec = typeof asset.duration === 'number' ? asset.duration : undefined;

      if (inferredMediaType === 'video' && durationSec != null && durationSec > MAX_VIDEO_SECONDS) {
        Alert.alert('Video too long', `Please upload a video under ${MAX_VIDEO_SECONDS} seconds.`);
        return;
      }

      await attachProofToTaskInstance({
        userId: user.id,
        careerId: recommendedCareerId,
        instanceId: taskVm.currentInstance.id,
        proofFile: {
          uri: asset.uri,
          mediaType: inferredMediaType,
          createdAt: new Date().toISOString(),
        },
      });

      await refresh();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  const onMarkComplete = async () => {
    if (!user || !recommendedCareerId || !taskVm?.currentInstance) return;
    try {
      if (!taskVm.currentInstance.proofFile) {
        Alert.alert('Proof required', 'Upload an image or short video before completing.');
        return;
      }

      const completed = await markTaskInstanceCompleted({
        userId: user.id,
        careerId: recommendedCareerId,
        instanceId: taskVm.currentInstance.id,
      });

      if (completed) {
        addCompletedTask(completed);
      }
      void refreshDashboard();
      await refresh();
      navigation.navigate('MyWork');
    } catch (e: any) {
      Alert.alert('Complete failed', e?.message ?? 'Something went wrong.');
    }
  };

  useEffect(() => {
    const taskId = taskVm?.currentInstance?.id;
    const steps = taskVm?.currentTaskTemplate?.steps;
    if (!taskId || !steps?.length) return;
    setStepChecks((prev) => {
      const next: Record<string, boolean> = {};
      steps.forEach((_s, idx) => {
        const key = `${taskId}_${idx}`;
        next[key] = prev[key] ?? false;
      });
      return next;
    });
  }, [taskVm?.currentInstance?.id, taskVm?.currentTaskTemplate?.steps]);

  const activeInstanceId = taskVm?.currentInstance?.id ?? '';

  useFocusEffect(
    React.useCallback(() => {
      const startedAt = Date.now();
      if (todayFirstFocus.current) {
        todayFirstFocus.current = false;
      } else {
        void refresh();
      }
      return () => {
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        void addFocusSeconds(seconds);
      };
    }, [addFocusSeconds, refresh]),
  );

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Good morning, {greetingName}</Text>
          <Text style={styles.subtitle}>Your learning track</Text>
          <Text style={styles.trackText}>{career?.title ?? '—'}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.profileIconButton, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate('ProfileModal')}
        >
          <Ionicons name="person-circle-outline" size={34} color={colors.textSecondary} />
        </Pressable>
      </View>

      {vmLoading ? (
        <Card style={styles.taskCard}>
          <Text style={styles.taskTitle}>Loading today&apos;s task...</Text>
        </Card>
      ) : taskVm?.trackComplete ? (
        <Card style={styles.taskCard}>
          <Text style={styles.taskTitle}>Track complete</Text>
          <Text style={styles.taskDesc}>You finished all tasks for this career.</Text>
        </Card>
      ) : taskVm?.currentTaskTemplate && taskVm.currentInstance ? (
        <Card style={styles.taskCard}>
          <Text style={styles.sectionEyebrow}>TODAY&apos;S TASK</Text>
          <Text style={styles.taskTitle}>{taskVm.currentTaskTemplate.title}</Text>
          <Text style={styles.taskDesc}>{taskVm.currentTaskTemplate.description}</Text>

          <Text style={styles.sectionLabel}>Why this matters</Text>
          <Text style={styles.sectionText}>{taskVm.currentTaskTemplate.why}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.startTaskButton,
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
            onPress={() => setIsTaskStarted((prev) => !prev)}
          >
            <Text style={styles.startTaskLabel}>{isTaskStarted ? 'Hide task steps' : 'Start Task'}</Text>
          </Pressable>

          {isTaskStarted && (
            <>
              <Text style={styles.sectionLabel}>Steps</Text>
              {taskVm.currentTaskTemplate.steps.map((s, idx) => {
                const key = `${activeInstanceId}_${idx}`;
                const checked = stepChecks[key] ?? false;
                return (
                  <Pressable
                    key={`${idx}-${s}`}
                    style={styles.stepRow}
                    onPress={() =>
                      setStepChecks((prev) => ({
                        ...prev,
                        [key]: !checked,
                      }))
                    }
                  >
                    <Ionicons
                      name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={checked ? colors.success : colors.textMuted}
                    />
                    <Text style={[styles.stepLine, checked && styles.stepLineDone]}>{s}</Text>
                  </Pressable>
                );
              })}
            </>
          )}

          <Text style={styles.metaText}>
            Time estimate: {taskVm.currentTaskTemplate.timeEstimateMinutes} minutes
          </Text>

          <View style={styles.proofBlock}>
            <Text style={styles.sectionLabel}>Proof upload</Text>
            {taskVm.currentInstance.proofFile ? (
              <Text style={styles.proofStatusSuccess}>
                Uploaded ({taskVm.currentInstance.proofFile.mediaType})
              </Text>
            ) : (
              <Text style={styles.proofStatus}>No proof uploaded yet</Text>
            )}

            {taskVm.currentInstance.proofFile && (
              <View style={styles.previewWrap}>
                {taskVm.currentInstance.proofFile.mediaType === 'image' ? (
                  <Image
                    source={{ uri: taskVm.currentInstance.proofFile.uri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.videoPreviewPlaceholder}>
                    <Text style={styles.videoPreviewLabel}>Video proof selected</Text>
                    <Text style={styles.videoPreviewMeta} numberOfLines={1}>
                      {taskVm.currentInstance.proofFile.uri}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.buttonRow}>
              <Pressable
                disabled={uploading}
                onPress={() => void pickProof('camera')}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && !uploading && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                  uploading && { opacity: 0.6 },
                ]}
              >
                <View style={styles.secondaryButtonInner}>
                  <Ionicons name="camera-outline" size={18} color={colors.accent} />
                  <Text style={styles.secondaryLabel}>
                    {uploading ? 'Uploading...' : 'Take photo/video'}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                disabled={uploading}
                onPress={() => void pickProof('library')}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && !uploading && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                  uploading && { opacity: 0.6 },
                ]}
              >
                <View style={styles.secondaryButtonInner}>
                  <Ionicons name="images-outline" size={18} color={colors.accent} />
                  <Text style={styles.secondaryLabel}>
                    {taskVm.currentInstance.proofFile ? 'Replace proof' : 'Choose from library'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => void onMarkComplete()}
            disabled={!taskVm.currentInstance.proofFile}
            style={({ pressed }) => [
              styles.primaryButton,
              !taskVm.currentInstance?.proofFile && { opacity: 0.45 },
              pressed && taskVm.currentInstance?.proofFile && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={styles.primaryLabel}>Mark as complete</Text>
          </Pressable>
        </Card>
      ) : taskVm?.nextUnlockAt ? (
        <Card style={styles.lockCard} blur={true}>
          <Text style={styles.lockTitle}>Next unlock</Text>
          <View style={styles.lockTimerRow}>
            <View style={styles.lockTimerBox}>
              <Text style={styles.lockTimerValue}>{hoursRemaining}</Text>
              <Text style={styles.lockTimerUnit}>hours</Text>
            </View>
            <View style={styles.lockTimerBox}>
              <Text style={styles.lockTimerValue}>{minutesRemaining}</Text>
              <Text style={styles.lockTimerUnit}>mins</Text>
            </View>
          </View>
          <Text style={styles.lockSubtitle}>Task unlock countdown</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '25%' }]} />
          </View>
        </Card>
      ) : (
        <Card style={styles.taskCard}>
          <Text style={styles.taskTitle}>No unlocked task</Text>
          <Text style={styles.taskDesc}>Please check back later.</Text>
        </Card>
      )}

      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>Tip for Today</Text>
        <Text style={styles.tipText}>{dailyTip}</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: 4,
  },
  trackText: {
    ...typography.subtitle,
    color: colors.accent,
    marginTop: 2,
  },
  profileIconButton: {
    borderRadius: radii.pill,
    padding: spacing.xs,
  },
  taskCard: {
    marginBottom: spacing.md,
    padding: spacing.xl,
  },
  taskTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  taskDesc: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  sectionEyebrow: {
    ...typography.meta,
    color: colors.accent,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metaChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  stepLine: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 2,
    flex: 1,
  },
  stepLineDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  metaText: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  proofBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  proofStatus: {
    ...typography.meta,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  proofStatusSuccess: {
    ...typography.meta,
    color: colors.success,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  previewWrap: {
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  videoPreviewPlaceholder: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    minHeight: 88,
    justifyContent: 'center',
  },
  videoPreviewLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  videoPreviewMeta: {
    ...typography.meta,
    color: colors.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryGradientStart,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTaskButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,211,238,0.08)',
  },
  startTaskLabel: {
    ...typography.subtitle,
    color: colors.accent,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  primaryLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  secondaryButton: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  secondaryLabel: {
    ...typography.subtitle,
    color: colors.accent,
  },
  lockCard: {
    marginTop: spacing.md,
  },
  lockTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  lockTimerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  lockTimerBox: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: 'rgba(34,211,238,0.08)',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  lockTimerValue: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  lockTimerUnit: {
    ...typography.meta,
    color: colors.textMuted,
  },
  lockSubtitle: {
    ...typography.meta,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(148,163,184,0.16)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
  },
  tipCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  tipTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

