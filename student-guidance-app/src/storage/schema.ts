export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  securityQuestion: string;
  securityAnswerHash: string;
  avatarHue: number;
  createdAt: string;
};

export type AuthState = {
  currentUserId: string | null;
};

export type TaskProofMediaType = 'image' | 'video';

export type TaskProofFile = {
  uri: string;
  mediaType: TaskProofMediaType;
  createdAt: string;
};

export type TaskTemplate = {
  id: string;
  careerId: string;
  dayIndex: number;
  title: string;
  description: string;
  why: string;
  steps: string[];
  materials: string[];
  timeEstimateMinutes: number;
};

export type DailyTaskInstanceStatus = 'pending' | 'unlocked' | 'completed';

export type DailyTaskInstance = {
  id: string;
  careerId: string;
  taskTemplateId: string;
  dayIndex: number;
  status: DailyTaskInstanceStatus;
  assignedDateKey: string | null; // local YYYY-MM-DD when unlocked
  unlockedAt?: string;
  completedAt?: string;
  proofFile?: TaskProofFile;
};

export const STORAGE_KEYS = {
  users: 'sgs_users',
  auth: 'sgs_auth',
  // key = `${taskTrackPrefix}${userId}_${careerId}`
  taskTrackPrefix: 'sgs_task_track_',
} as const;

