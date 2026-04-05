import { CAREER_CATALOG, CAREER_THEMES } from './careers';
import type { CareerDiscoveryState } from '../storage/careerDiscovery';

export type CareerRecommendation = {
  recommendedCareerId: string;
  scores: Record<string, number>;
  topCareerIds: string[];
  whyFits: string[];
};

// Recommendation heuristic (v1):
// - Boost careers in clusters that match selected images and MCQ answers.
// - Use reflections to bias toward people / systems / impact heavy paths.
export function recommendCareer(state: CareerDiscoveryState): CareerRecommendation {
  const selected = state.selectedCareerIds;

  const clusterBoost: Record<string, number> = {};
  for (const c of CAREER_THEMES) clusterBoost[c.id] = 0;

  // Phase 1: image selections gently boost matching clusters
  for (const sel of selected) {
    if (sel.toLowerCase().includes('cyber')) clusterBoost.cybersecurity += 4;
    if (sel.toLowerCase().includes('software') || sel.toLowerCase().includes('developer')) {
      clusterBoost.software_engineer += 4;
    }
    if (sel.toLowerCase().includes('data') || sel.toLowerCase().includes('scientist')) {
      clusterBoost.data_analyst += 4;
    }
    if (sel.toLowerCase().includes('design') || sel.toLowerCase().includes('ux')) {
      clusterBoost.designer += 4;
    }
  }

  // Phase 2: MCQ answers
  const phase2Answers = state.phase2.answersByQuestionId;
  for (const [qid, ans] of Object.entries(phase2Answers)) {
    if (!ans || !ans.optionId || ans.skipped) continue;
    const opt = ans.optionId;
    if (qid === 'q1') {
      if (opt === 'o1') clusterBoost.software_engineer += 3;
      if (opt === 'o2') clusterBoost.designer += 3;
      if (opt === 'o3') clusterBoost.data_analyst += 3;
    }
    if (qid === 'q4') {
      if (opt === 'o1') clusterBoost.software_engineer += 2;
      if (opt === 'o2') clusterBoost.designer += 2;
      if (opt === 'o3') clusterBoost.data_analyst += 2;
      if (opt === 'o4') clusterBoost.data_analyst += 2;
    }
  }

  // Phase 3: reflections
  const reflections = state.phase3.reflections;
  const combinedReflections = reflections
    ? `${reflections.q1}\n\n${reflections.q2}\n\n${reflections.q3}`
    : state.phase3.longForm;
  const longForm = combinedReflections.trim();
  const snippet = longForm ? longForm.slice(0, 120).replace(/\s+/g, ' ') : '';

  if (longForm) {
    const lower = longForm.toLowerCase();
    if (lower.includes('security') || lower.includes('privacy')) clusterBoost.cybersecurity += 3;
    if (lower.includes('design') || lower.includes('interface')) clusterBoost.designer += 3;
    if (lower.includes('data') || lower.includes('analysis')) clusterBoost.data_analyst += 3;
    if (lower.includes('build') || lower.includes('code')) clusterBoost.software_engineer += 3;
  }

  // Score full catalog using cluster boosts.
  const scores: Record<string, number> = {};
  for (const career of CAREER_CATALOG) {
    scores[career.id] = (clusterBoost[career.clusterId] ?? 0) + 1;
  }

  const sorted = [...CAREER_CATALOG].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
  );

  const top = sorted.slice(0, 5);

  // Choose a base track ID from the highest scoring catalog item.
  const topClusterId = top[0]?.clusterId ?? CAREER_THEMES[0]?.id ?? 'cybersecurity';
  const recommendedCareerId = topClusterId;

  const recommendedTheme = CAREER_THEMES.find((c) => c.id === recommendedCareerId);
  const recommendedTitle = recommendedTheme?.title ?? 'your path';

  return {
    recommendedCareerId,
    scores,
    topCareerIds: top.map((c) => c.id),
    whyFits: [
      `Your choices point toward ${recommendedTitle}.`,
      snippet
        ? `In your reflections, you mentioned: "${snippet}${longForm.length > 120 ? '…' : ''}"`
        : 'Your reflection shows clear motivation and self-awareness.',
      'This track will help you practice real-world skills with daily tasks.',
    ],
  };
}

