import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme';
import { useAppState } from '../state/appState';
import { getTaskTemplatesForCareer } from '../utils/taskTemplates';

export function MyWorkScreen() {
  const { recommendedCareerId, completedTasks, loading } = useAppState();

  const templates = useMemo(() => {
    if (!recommendedCareerId) return [];
    return getTaskTemplatesForCareer(recommendedCareerId);
  }, [recommendedCareerId]);

  const templateById = useMemo(() => {
    const m = new Map<string, (typeof templates)[number]>();
    for (const t of templates) m.set(t.id, t);
    return m;
  }, [templates]);

  const items = useMemo(
    () => completedTasks.filter((c) => Boolean(c.proofFile)),
    [completedTasks],
  );

  return (
    <ScreenContainer>
      <Text style={styles.title}>My Work</Text>
      <Text style={styles.subtitle}>Completed tasks with proof uploads.</Text>

      <Card style={styles.card}>
        <Text style={styles.summaryLabel}>Track</Text>
        <Text style={styles.summaryValue}>{recommendedCareerId ?? '—'}</Text>
        <Text style={styles.smallMeta}>Completed with proof: {items.length}</Text>
      </Card>

      {loading ? (
        <Card style={styles.card}>
          <Text style={styles.placeholderTitle}>Loading…</Text>
        </Card>
      ) : items.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="folder-open-outline" size={34} color={colors.textMuted} />
          <Text style={styles.placeholderTitle}>No completed tasks yet</Text>
          <Text style={styles.placeholderText}>Upload proof and complete tasks from `Today`.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {items.map((it) => {
            const t = templateById.get(it.taskTemplateId);
            return (
              <Card key={it.id} style={styles.listItem}>
                <View style={styles.itemTitleRow}>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={18}
                    color={colors.success}
                    style={styles.itemTitleIcon}
                  />
                  <Text style={styles.itemTitle}>{t?.title ?? it.taskTemplateId}</Text>
                </View>
                <View style={styles.previewWrap}>
                  {it.proofFile?.mediaType === 'image' ? (
                    <Image
                      source={{ uri: it.proofFile.uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.videoPreviewPlaceholder}>
                      <Text style={styles.videoPreviewLabel}>Video proof</Text>
                      <Text style={styles.videoPreviewMeta} numberOfLines={1}>
                        {it.proofFile?.uri ?? ''}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.itemMeta}>
                  Completed: {it.completedAt ? new Date(it.completedAt).toLocaleString() : '—'}
                </Text>
              </Card>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

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
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  placeholderTitle: {
    ...typography.subtitle,
    color: colors.accent,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  smallMeta: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  summaryLabel: {
    ...typography.meta,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    ...typography.subtitle,
    color: colors.accent,
  },
  list: {
    gap: spacing.md,
  },
  listItem: {
    padding: spacing.xl,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemTitleIcon: {
    marginRight: spacing.xs,
  },
  itemTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    flex: 1,
  },
  itemMeta: {
    ...typography.meta,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  previewWrap: {
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  videoPreviewPlaceholder: {
    minHeight: 84,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    padding: spacing.md,
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
  emptyCard: {
    padding: spacing.xl,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    gap: spacing.sm,
  },
});

