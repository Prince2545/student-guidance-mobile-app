import type { DailyTaskInstance, TaskTemplate } from '../storage/schema';
import { ensureTaskTrackInitialized, getTaskInstances, setTaskInstanceStatus } from '../storage/tasks';
import { getTaskTemplatesForCareer } from './taskTemplates';

export type TodayTaskViewModel = {
  currentTaskTemplate: TaskTemplate | null;
  currentInstance: DailyTaskInstance | null;
  nextUnlockAt: Date | null;
  trackComplete: boolean;
};

export async function getTodayTaskViewModel(params: {
  userId: string;
  careerId: string;
  now?: Date;
}): Promise<TodayTaskViewModel> {
  const { userId, careerId, now = new Date() } = params;

  const templates = getTaskTemplatesForCareer(careerId);
  if (!templates.length) {
    return {
      currentTaskTemplate: null,
      currentInstance: null,
      nextUnlockAt: null,
      trackComplete: true,
    };
  }

  await ensureTaskTrackInitialized({ userId, careerId, now });
  let instances = await getTaskInstances({ userId, careerId });

  // Normalize: keep only one unlocked task active.
  const unlocked = instances.filter((i) => i.status === 'unlocked');
  if (unlocked.length > 1) {
    unlocked.sort((a, b) => a.dayIndex - b.dayIndex);
    const keeper = unlocked[0];
    // Set others back to pending to preserve "no skipping".
    await Promise.all(
      unlocked.slice(1).map((i) =>
        setTaskInstanceStatus({ userId, careerId, instanceId: i.id, status: 'pending', now }),
      ),
    );
    instances = await getTaskInstances({ userId, careerId });
  }

  const currentUnlocked = instances.find((i) => i.status === 'unlocked');
  const templateForInstance = (inst: DailyTaskInstance | null) => {
    if (!inst) return null;
    return templates.find((t) => t.id === inst.taskTemplateId) ?? null;
  };

  if (currentUnlocked) {
    return {
      currentTaskTemplate: templateForInstance(currentUnlocked),
      currentInstance: currentUnlocked,
      nextUnlockAt: null,
      trackComplete: false,
    };
  }

  const lastCompleted = instances
    .filter((i) => i.status === 'completed' && i.completedAt)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0];

  const nextDayIndex = lastCompleted ? lastCompleted.dayIndex + 1 : 0;
  const nextPending = instances.find((i) => i.status === 'pending' && i.dayIndex === nextDayIndex);

  if (!nextPending) {
    return {
      currentTaskTemplate: null,
      currentInstance: null,
      nextUnlockAt: null,
      trackComplete: true,
    };
  }

  const base = lastCompleted?.completedAt
    ? new Date(lastCompleted.completedAt)
    : null;
  const nextUnlockAt = base ? new Date(base.getTime() + 24 * 60 * 60 * 1000) : null;

  if (nextUnlockAt && now.getTime() < nextUnlockAt.getTime()) {
    return {
      currentTaskTemplate: null,
      currentInstance: null,
      nextUnlockAt,
      trackComplete: false,
    };
  }

  // Unlock the next pending task (exactly one at a time).
  await setTaskInstanceStatus({
    userId,
    careerId,
    instanceId: nextPending.id,
    status: 'unlocked',
    now,
  });

  const refreshed = await getTaskInstances({ userId, careerId });
  const unlockedNow = refreshed.find((i) => i.id === nextPending.id && i.status === 'unlocked') ?? null;

  return {
    currentTaskTemplate: templateForInstance(unlockedNow),
    currentInstance: unlockedNow,
    nextUnlockAt: null,
    trackComplete: false,
  };
}

