import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { DailyTaskInstance, DailyTaskInstanceStatus, TaskProofFile, TaskTemplate } from './schema';
import { STORAGE_KEYS } from './schema';
import { getTaskTemplatesForCareer } from '../utils/taskTemplates';
import { getLocalDateKey } from '../utils/time';

const getTaskTrackKey = (userId: string, careerId: string) =>
  `${STORAGE_KEYS.taskTrackPrefix}${userId}_${careerId}`;

async function getInstancesRaw(userId: string, careerId: string): Promise<DailyTaskInstance[]> {
  const raw = await AsyncStorage.getItem(getTaskTrackKey(userId, careerId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DailyTaskInstance[];
  } catch {
    return [];
  }
}

async function saveInstances(userId: string, careerId: string, instances: DailyTaskInstance[]): Promise<void> {
  await AsyncStorage.setItem(getTaskTrackKey(userId, careerId), JSON.stringify(instances));
}

export async function getTaskTemplatesOrThrow(careerId: string): Promise<TaskTemplate[]> {
  const templates = getTaskTemplatesForCareer(careerId);
  if (!templates.length) throw new Error('No task templates found for this career.');
  return templates;
}

export async function ensureTaskTrackInitialized(params: { userId: string; careerId: string; now?: Date }) {
  const { userId, careerId, now = new Date() } = params;
  const existing = await getInstancesRaw(userId, careerId);
  if (existing.length) return existing;

  const templates = await getTaskTemplatesOrThrow(careerId);
  const todayKey = getLocalDateKey(now);

  const instances: DailyTaskInstance[] = templates.map((t, idx) => {
    const status: DailyTaskInstanceStatus = idx === 0 ? 'unlocked' : 'pending';
    return {
      id: uuidv4(),
      careerId,
      taskTemplateId: t.id,
      dayIndex: t.dayIndex,
      status,
      assignedDateKey: idx === 0 ? todayKey : null,
      unlockedAt: idx === 0 ? now.toISOString() : undefined,
    };
  });

  await saveInstances(userId, careerId, instances);
  return instances;
}

export async function getTaskInstances(params: { userId: string; careerId: string }): Promise<DailyTaskInstance[]> {
  return getInstancesRaw(params.userId, params.careerId);
}

export async function setTaskInstanceStatus(params: {
  userId: string;
  careerId: string;
  instanceId: string;
  status: DailyTaskInstanceStatus;
  now?: Date;
}): Promise<DailyTaskInstance | null> {
  const { userId, careerId, instanceId, status, now = new Date() } = params;
  const instances = await getInstancesRaw(userId, careerId);
  const idx = instances.findIndex((i) => i.id === instanceId);
  if (idx === -1) return null;

  const next = { ...instances[idx] };
  next.status = status;

  if (status === 'unlocked') {
    next.unlockedAt = now.toISOString();
    next.assignedDateKey = getLocalDateKey(now);
  } else {
    next.unlockedAt = undefined;
    next.assignedDateKey = null;
  }

  if (status === 'completed') {
    next.completedAt = now.toISOString();
  } else {
    next.completedAt = undefined;
  }

  instances[idx] = next;
  await saveInstances(userId, careerId, instances);
  return next;
}

export async function attachProofToTaskInstance(params: {
  userId: string;
  careerId: string;
  instanceId: string;
  proofFile: TaskProofFile;
}): Promise<DailyTaskInstance | null> {
  const { userId, careerId, instanceId, proofFile } = params;
  const instances = await getInstancesRaw(userId, careerId);
  const idx = instances.findIndex((i) => i.id === instanceId);
  if (idx === -1) return null;

  const inst = instances[idx];
  if (inst.status !== 'unlocked') {
    throw new Error('You can only upload proof for an unlocked task.');
  }

  const next: DailyTaskInstance = { ...inst, proofFile };
  instances[idx] = next;
  await saveInstances(userId, careerId, instances);
  return next;
}

export async function markTaskInstanceCompleted(params: {
  userId: string;
  careerId: string;
  instanceId: string;
  now?: Date;
}): Promise<DailyTaskInstance | null> {
  const { userId, careerId, instanceId, now = new Date() } = params;
  const instances = await getInstancesRaw(userId, careerId);
  const idx = instances.findIndex((i) => i.id === instanceId);
  if (idx === -1) return null;

  const inst = instances[idx];
  if (inst.status !== 'unlocked') {
    throw new Error('Only an unlocked task can be completed.');
  }
  if (!inst.proofFile) {
    throw new Error('Upload proof before marking the task complete.');
  }

  const next: DailyTaskInstance = {
    ...inst,
    status: 'completed',
    completedAt: now.toISOString(),
  };
  instances[idx] = next;
  await saveInstances(userId, careerId, instances);
  return next;
}

export async function getCompletedTaskInstances(params: {
  userId: string;
  careerId: string;
}): Promise<DailyTaskInstance[]> {
  const instances = await getInstancesRaw(params.userId, params.careerId);
  return instances
    .filter((i) => i.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}

export async function clearAllTaskDataForUser(userId: string): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const prefix = `${STORAGE_KEYS.taskTrackPrefix}${userId}_`;
  const taskKeys = allKeys.filter((k) => k.startsWith(prefix));
  if (!taskKeys.length) return;
  await AsyncStorage.multiRemove(taskKeys);
}

