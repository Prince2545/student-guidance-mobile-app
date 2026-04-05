import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, radii, spacing, typography } from '../../theme';
import { CAREER_IMAGE_ITEMS } from '../../utils/careerImages';
import { savePhase1Selection } from '../../storage/careerDiscovery';
import { useAppState } from '../../state/appState';

type Props = NativeStackScreenProps<any>;

export const CareerPhaseOneScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAppState();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return Array.from(next);
    });
  };

  const canContinue = selectedIds.length > 0;

  const onContinue = async () => {
    if (!user) return;
    await savePhase1Selection(user.id, selectedIds);
    navigation.navigate('PhaseTwo');
  };

  return (
    <ScreenContainer>
      <Text style={styles.stepLabel}>Phase 1 of 4</Text>
      <Text style={styles.title}>Pick careers that look exciting</Text>
      <Text style={styles.subtitle}>Tap one or more images that feel interesting or inspiring.</Text>

      <FlatList
        data={CAREER_IMAGE_ITEMS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => {
          const active = selectedSet.has(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              style={({ pressed }) => [
                styles.itemPressable,
                pressed && { transform: [{ scale: 0.99 }] },
              ]}
            >
              <Card style={[styles.itemCard, active && styles.itemCardActive]} blur={false}>
                <View style={styles.imageWrapper}>
                  <Image source={item.source} style={styles.image} resizeMode="cover" />
                  {active && (
                    <View style={styles.imageOverlay}>
                      <Text style={styles.imageOverlayText}>Selected</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.itemTitle, active && { color: colors.textPrimary }]}>
                  {item.title}
                </Text>
              </Card>
            </Pressable>
          );
        }}
      />

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
  grid: {
    paddingBottom: spacing['2xl'],
  },
  columnWrapper: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemPressable: {
    flex: 1,
  },
  itemCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.lg,
    minHeight: 140,
  },
  itemCardActive: {
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'rgba(34,211,238,0.08)',
  },
  imageWrapper: {
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 120,
  },
  imageOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayText: {
    ...typography.meta,
    color: colors.accent,
    fontWeight: '700',
  },
  itemTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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

