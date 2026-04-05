import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, radii, spacing, typography } from '../../theme';
import { useAppState } from '../../state/appState';
import { completeCareerDiscovery, getCareerDiscoveryState } from '../../storage/careerDiscovery';
import { recommendCareer } from '../../utils/recommendation';
import { CAREER_CATALOG, getCareerById } from '../../utils/careers';
import { ensureTaskTrackInitialized } from '../../storage/tasks';

type Props = NativeStackScreenProps<any>;

export const CareerResultScreen: React.FC<Props> = ({ navigation }) => {
  const { user, refresh } = useAppState();
  const [whyFits, setWhyFits] = useState<string[]>([]);
  const [recommendedCareerId, setRecommendedCareerId] = useState<string | null>(null);
  const [topCareerIds, setTopCareerIds] = useState<string[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const state = await getCareerDiscoveryState(user.id);
      const rec = recommendCareer(state);
      setRecommendedCareerId(rec.recommendedCareerId);
      setWhyFits(rec.whyFits);
      setTopCareerIds(rec.topCareerIds);
      if (rec.topCareerIds[0]) {
        setSelectedCareerId(rec.topCareerIds[0]);
      }
      setLoading(false);
    })();
  }, [user]);

  const recommendedCareer = useMemo(() => {
    if (!recommendedCareerId) return undefined;
    return getCareerById(recommendedCareerId);
  }, [recommendedCareerId]);

  const selectedCatalogCareer = useMemo(
    () => CAREER_CATALOG.find((c) => c.id === selectedCareerId) ?? null,
    [selectedCareerId],
  );

  const onStartJourney = async () => {
    if (!user || !recommendedCareerId || !selectedCatalogCareer) return;
    await ensureTaskTrackInitialized({ userId: user.id, careerId: recommendedCareerId });
    await completeCareerDiscovery({
      userId: user.id,
      recommendedCareerId,
      recommendationWhyFits: whyFits,
    });
    await refresh();
    const root = navigation.getParent<any>();
    root?.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  if (!user) {
    return (
      <ScreenContainer scrollable={false}>
        <Text style={styles.error}>No user found.</Text>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <Text style={styles.loading}>Computing your recommendations…</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.stepLabel}>Phase 4 of 4</Text>
      <Text style={styles.title}>Choose your starting direction</Text>
      <Text style={styles.subtitle}>
        Based on your choices and reflections, here are careers that could fit you. Pick one to
        start with—it&apos;s a starting point, not a lifetime contract.
      </Text>

      <Card
        style={[
          styles.resultCard,
          recommendedCareer?.hue
            ? { borderColor: `hsla(${recommendedCareer.hue}, 90%, 55%, 0.6)` }
            : undefined,
        ]}
      >
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              recommendedCareer?.hue
                ? {
                    backgroundColor: `hsla(${recommendedCareer.hue}, 90%, 55%, 0.18)`,
                  }
                : undefined,
            ]}
          >
            <Text style={styles.badgeText}>
              Recommended
            </Text>
          </View>
          <Text style={styles.careerTitle}>{recommendedCareer?.title ?? 'Your track'}</Text>
        </View>

        <Text style={styles.sectionLabel}>Why this fits you</Text>
        <View style={styles.whyList}>
          {whyFits.map((t, idx) => (
            <View key={`${t}-${idx}`} style={styles.whyItem}>
              <Text style={styles.whyDot}>•</Text>
              <Text style={styles.whyText}>{t}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={styles.sectionLabel}>Top matches for you</Text>
      <View style={styles.topList}>
        {topCareerIds.map((id) => {
          const c = CAREER_CATALOG.find((ci) => ci.id === id);
          if (!c) return null;
          const active = selectedCareerId === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setSelectedCareerId(c.id)}
              style={({ pressed }) => [
                styles.topItem,
                active && styles.topItemActive,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.topItemTitle}>{c.name}</Text>
              <Text style={styles.topItemDesc}>{c.shortDescription}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Explore more options</Text>
      <View style={styles.catalogGrid}>
        {CAREER_CATALOG.map((c) => {
          const active = selectedCareerId === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setSelectedCareerId(c.id)}
              style={({ pressed }) => [
                styles.catalogPill,
                active && styles.catalogPillActive,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.catalogPillLabel}>{c.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onStartJourney}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && { transform: [{ scale: 0.99 }] },
        ]}
      >
        <Text style={styles.primaryLabel}>Start my journey</Text>
      </Pressable>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  error: {
    ...typography.body,
    color: colors.danger,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
  },
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
  resultCard: {
    padding: spacing.lg,
  },
  badgeRow: {
    marginBottom: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },
  badgeText: {
    ...typography.meta,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  careerTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  sectionLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  whyList: {
    gap: spacing.sm,
  },
  whyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  whyDot: {
    ...typography.body,
    color: colors.accent,
    lineHeight: 20,
  },
  whyText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primaryGradientStart,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  primaryLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  topList: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  topItem: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceElevated,
  },
  topItemActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(34,211,238,0.12)',
  },
  topItemTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  topItemDesc: {
    ...typography.meta,
    color: colors.textSecondary,
  },
  catalogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  catalogPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: spacing.xs,
  },
  catalogPillActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(34,211,238,0.16)',
  },
  catalogPillLabel: {
    ...typography.meta,
    color: colors.textSecondary,
  },
});

