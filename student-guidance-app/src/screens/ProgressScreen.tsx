import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { colors, radii, spacing, typography } from '../theme';
import { useAppState } from '../state/appState';
import {
  getCurrentWeekKeys,
  getLastNDaysKeys,
  getStreak,
  getTasksCompleted,
  getXpAndLevel,
} from '../utils/progressMetrics';
import { buildActivityGrid } from '../utils/progressGrid';

export function ProgressScreen() {
  const { completionByDate, mentorActivityByDate, focusSecondsByDate } = useAppState();
  const tasksCompleted = useMemo(() => getTasksCompleted(completionByDate), [completionByDate]);
  const streak = useMemo(() => getStreak(completionByDate), [completionByDate]);
  const { xp, level, levelProgress } = useMemo(() => getXpAndLevel(tasksCompleted), [tasksCompleted]);

  const grid = useMemo(() => buildActivityGrid({ completionByDate, weeks: 8 }), [completionByDate]);
  const weekKeys = useMemo(() => getCurrentWeekKeys(), []);
  const last7Keys = useMemo(() => getLastNDaysKeys(7), []);
  const todayKey = last7Keys[last7Keys.length - 1];
  const dailyFocusSeconds = focusSecondsByDate[todayKey] ?? 0;
  const weeklyFocusAvg = useMemo(
    () => last7Keys.reduce((acc, key) => acc + (focusSecondsByDate[key] ?? 0), 0) / 7,
    [focusSecondsByDate, last7Keys],
  );

  const weeklyActions = useMemo(
    () =>
      weekKeys.map((key) => ({
        key,
        total: (completionByDate[key] ?? 0) + (mentorActivityByDate[key] ?? 0),
      })),
    [weekKeys, completionByDate, mentorActivityByDate],
  );
  const weeklyMax = useMemo(() => Math.max(1, ...weeklyActions.map((x) => x.total)), [weeklyActions]);

  const cellColor = (intensity: 0 | 1 | 2 | 3) => {
    if (intensity === 0) return 'rgba(51,65,85,0.35)';
    if (intensity === 1) return 'rgba(34,197,94,0.35)';
    if (intensity === 2) return 'rgba(34,197,94,0.60)';
    return 'rgba(74,222,128,0.95)';
  };

  const toMins = (seconds: number) => Math.round(seconds / 60);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>Streaks, activity, and XP update in real time.</Text>

      <View style={styles.grid}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="trophy-outline" size={18} color={colors.warning} />
            <Text style={styles.cardTitle}>Level</Text>
          </View>
          <Text style={styles.cardValue}>Level {level}</Text>
          <Text style={styles.cardMeta}>{xp} XP total • {levelProgress}/100 to next</Text>
        </Card>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="flame-outline" size={18} color={colors.warning} />
            <Text style={styles.cardTitle}>Streak</Text>
          </View>
          <Text style={styles.cardValue}>{streak} day{streak === 1 ? '' : 's'}</Text>
          <Text style={styles.cardMeta}>{tasksCompleted} tasks completed</Text>
        </Card>
      </View>

      <Card style={styles.cardWide}>
        <Text style={styles.cardTitle}>Consistency Grid</Text>
        <View style={styles.gridWrap}>
          {grid.map((row, rowIdx) => (
            <View key={`row-${rowIdx}`} style={styles.gridRow}>
              {row.map((cell) => (
                <View
                  key={cell.key}
                  style={[styles.gridCell, { backgroundColor: cellColor(cell.intensity) }]}
                />
              ))}
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.cardWide}>
        <Text style={styles.cardTitle}>Weekly Activity</Text>
        <View style={styles.barChart}>
          {weeklyActions.map((item) => (
            <View key={item.key} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  { height: `${(item.total / weeklyMax) * 100}%` },
                ]}
              />
              <Text style={styles.barLabel}>{item.key.slice(-2)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.cardWide}>
        <Text style={styles.cardTitle}>Focus Time</Text>
        <Text style={styles.placeholder}>Today: {toMins(dailyFocusSeconds)} min</Text>
        <Text style={styles.placeholder}>Weekly avg: {toMins(weeklyFocusAvg)} min/day</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontSize: 26,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    fontSize: 16,
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    padding: spacing.xl,
    minHeight: 170,
  },
  cardWide: {
    padding: spacing.xl,
    marginTop: spacing.md,
    minHeight: 190,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    fontSize: 17,
  },
  cardValue: {
    ...typography.heading2,
    color: colors.textPrimary,
    fontSize: 30,
    marginTop: spacing.xs,
  },
  cardMeta: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontSize: 13,
  },
  placeholder: {
    ...typography.body,
    color: colors.textMuted,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  gridWrap: {
    marginTop: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  gridCell: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 170,
    marginTop: spacing.md,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  bar: {
    width: 18,
    maxHeight: '100%',
    minHeight: 8,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  barLabel: {
    ...typography.meta,
    color: colors.textMuted,
    fontSize: 13,
  },
});

