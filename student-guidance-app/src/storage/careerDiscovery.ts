import AsyncStorage from '@react-native-async-storage/async-storage';

export type CareerDiscoveryState = {
  selectedCareerIds: string[];
  phase1CompletedAt?: string;
  phase2: {
    answersByQuestionId: Record<
      string,
      {
        optionId: string | null;
        anythingElse?: string;
        skipped?: boolean;
      }
    >;
  };
  phase3: {
    // legacy single-response field (kept for backwards compatibility)
    longForm: string;
    // new multi-question reflections
    reflections?: {
      q1: string;
      q2: string;
      q3: string;
    };
  };
  // Recommendation / completion
  recommendedCareerId: string | null;
  recommendationWhyFits: string[];
  hasCompletedCareerDiscovery: boolean;
  completedAt?: string;
};

const getCareerKey = (userId: string) => `sgs_career_${userId}`;

function getDefaultState(): CareerDiscoveryState {
  return {
    selectedCareerIds: [],
    phase2: { answersByQuestionId: {} },
    phase3: { longForm: '' },
    recommendedCareerId: null,
    recommendationWhyFits: [],
    hasCompletedCareerDiscovery: false,
  };
}

export async function getCareerDiscoveryState(
  userId: string,
): Promise<CareerDiscoveryState> {
  const raw = await AsyncStorage.getItem(getCareerKey(userId));
  if (!raw) return getDefaultState();
  try {
    const parsed = JSON.parse(raw) as CareerDiscoveryState;
    // Ensure new fields always exist so downstream logic can rely on them.
    return {
      ...getDefaultState(),
      ...parsed,
      phase2: parsed.phase2 ?? getDefaultState().phase2,
      phase3: {
        longForm: parsed.phase3?.longForm ?? '',
        reflections: parsed.phase3?.reflections ?? {
          q1: '',
          q2: '',
          q3: '',
        },
      },
    };
  } catch {
    return getDefaultState();
  }
}

async function saveCareerDiscoveryState(
  userId: string,
  next: CareerDiscoveryState,
): Promise<void> {
  await AsyncStorage.setItem(getCareerKey(userId), JSON.stringify(next));
}

export async function savePhase1Selection(
  userId: string,
  selectedCareerIds: string[],
): Promise<void> {
  const current = await getCareerDiscoveryState(userId);
  await saveCareerDiscoveryState(userId, {
    ...current,
    selectedCareerIds,
    phase1CompletedAt: new Date().toISOString(),
  });
}

export async function savePhase2Answers(
  userId: string,
  answersByQuestionId: CareerDiscoveryState['phase2']['answersByQuestionId'],
): Promise<void> {
  const current = await getCareerDiscoveryState(userId);
  await saveCareerDiscoveryState(userId, {
    ...current,
    phase2: { answersByQuestionId },
  });
}

export async function savePhase3Answer(params: {
  userId: string;
  q1: string;
  q2: string;
  q3: string;
}): Promise<void> {
  const { userId, q1, q2, q3 } = params;
  const current = await getCareerDiscoveryState(userId);
  await saveCareerDiscoveryState(userId, {
    ...current,
    phase3: {
      longForm: `${q1}\n\n${q2}\n\n${q3}`.trim(),
      reflections: { q1, q2, q3 },
    },
  });
}

export async function completeCareerDiscovery(params: {
  userId: string;
  recommendedCareerId: string;
  recommendationWhyFits: string[];
}): Promise<void> {
  const current = await getCareerDiscoveryState(params.userId);
  await saveCareerDiscoveryState(params.userId, {
    ...current,
    recommendedCareerId: params.recommendedCareerId,
    recommendationWhyFits: params.recommendationWhyFits,
    hasCompletedCareerDiscovery: true,
    completedAt: new Date().toISOString(),
  });
}

export async function clearCareerDiscoveryState(userId: string): Promise<void> {
  await AsyncStorage.removeItem(getCareerKey(userId));
}

