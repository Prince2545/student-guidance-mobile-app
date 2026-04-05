import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../storage/schema';
import { getCurrentUser } from '../storage/auth';
import { getCareerDiscoveryState } from '../storage/careerDiscovery';
import { getCompletedTaskInstances } from '../storage/tasks';
import type { DailyTaskInstance } from '../storage/schema';

type DateCountMap = Record<string, number>;

const mentorActivityKey = (userId: string) => `sgs_activity_${userId}`;
const focusTimeKey = (userId: string) => `sgs_focus_${userId}`;

const safeParseDateMap = (raw: string | null): DateCountMap => {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as DateCountMap;
  } catch {
    return {};
  }
};

type AppState = {
  user: User | null;
  hasCompletedCareerDiscovery: boolean;
  recommendedCareerId: string | null;
  completedTasks: DailyTaskInstance[];
  completionByDate: DateCountMap;
  mentorActivityByDate: DateCountMap;
  focusSecondsByDate: DateCountMap;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  addCompletedTask: (task: DailyTaskInstance) => void;
  incrementMentorActivity: (delta?: number) => Promise<void>;
  addFocusSeconds: (deltaSeconds: number) => Promise<void>;
};

const AppStateContext = createContext<AppState | null>(null);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedCareerDiscovery, setHasCompletedCareerDiscovery] = useState(false);
  const [recommendedCareerId, setRecommendedCareerId] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<DailyTaskInstance[]>([]);
  const [completionByDate, setCompletionByDate] = useState<DateCountMap>({});
  const [mentorActivityByDate, setMentorActivityByDate] = useState<DateCountMap>({});
  const [focusSecondsByDate, setFocusSecondsByDate] = useState<DateCountMap>({});
  const [loading, setLoading] = useState(true);

  const refreshDashboard = useCallback(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      setCompletedTasks([]);
      setCompletionByDate({});
      setMentorActivityByDate({});
      setFocusSecondsByDate({});
      return;
    }

    const career = await getCareerDiscoveryState(currentUser.id);
    const careerId = career.recommendedCareerId;
    if (!careerId) {
      setCompletedTasks([]);
      setCompletionByDate({});
    } else {
      const completed = await getCompletedTaskInstances({
        userId: currentUser.id,
        careerId,
      });
      setCompletedTasks(completed);

      const map: DateCountMap = {};
      for (const item of completed) {
        if (!item.completedAt) continue;
        const d = new Date(item.completedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate(),
        ).padStart(2, '0')}`;
        map[key] = (map[key] ?? 0) + 1;
      }
      setCompletionByDate(map);
    }

    const [activityRaw, focusRaw] = await Promise.all([
      AsyncStorage.getItem(mentorActivityKey(currentUser.id)),
      AsyncStorage.getItem(focusTimeKey(currentUser.id)),
    ]);
    setMentorActivityByDate(safeParseDateMap(activityRaw));
    setFocusSecondsByDate(safeParseDateMap(focusRaw));
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (!currentUser) {
        setHasCompletedCareerDiscovery(false);
        setRecommendedCareerId(null);
        setCompletedTasks([]);
        setCompletionByDate({});
        setMentorActivityByDate({});
        setFocusSecondsByDate({});
        return;
      }

      const career = await getCareerDiscoveryState(currentUser.id);
      setHasCompletedCareerDiscovery(career.hasCompletedCareerDiscovery);
      setRecommendedCareerId(career.recommendedCareerId);
      await refreshDashboard();
    } finally {
      setLoading(false);
    }
  }, [refreshDashboard]);

  const incrementMentorActivity = useCallback(
    async (delta = 1) => {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;
      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate(),
      ).padStart(2, '0')}`;
      let nextMap: DateCountMap = {};
      setMentorActivityByDate((prev) => {
        nextMap = {
          ...prev,
          [key]: (prev[key] ?? 0) + delta,
        };
        return nextMap;
      });
      await AsyncStorage.setItem(mentorActivityKey(currentUser.id), JSON.stringify(nextMap));
    },
    [],
  );

  const addFocusSeconds = useCallback(
    async (deltaSeconds: number) => {
      if (deltaSeconds <= 0) return;
      const currentUser = await getCurrentUser();
      if (!currentUser) return;
      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate(),
      ).padStart(2, '0')}`;
      let nextMap: DateCountMap = {};
      setFocusSecondsByDate((prev) => {
        nextMap = {
          ...prev,
          [key]: (prev[key] ?? 0) + deltaSeconds,
        };
        return nextMap;
      });
      await AsyncStorage.setItem(focusTimeKey(currentUser.id), JSON.stringify(nextMap));
    },
    [],
  );

  const addCompletedTask = useCallback((task: DailyTaskInstance) => {
    if (!task.completedAt) return;
    const completedDate = new Date(task.completedAt);
    const key = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}-${String(
      completedDate.getDate(),
    ).padStart(2, '0')}`;
    const alreadyIncluded = completedTasks.some((item) => item.id === task.id);

    setCompletedTasks((prev) => {
      const withoutSame = prev.filter((item) => item.id !== task.id);
      return [task, ...withoutSame];
    });
    if (!alreadyIncluded) {
      setCompletionByDate((prev) => ({
        ...prev,
        [key]: (prev[key] ?? 0) + 1,
      }));
    }
  }, [completedTasks]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AppState>(
    () => ({
      user,
      hasCompletedCareerDiscovery,
      recommendedCareerId,
      completedTasks,
      completionByDate,
      mentorActivityByDate,
      focusSecondsByDate,
      loading,
      refresh,
      refreshDashboard,
      addCompletedTask,
      incrementMentorActivity,
      addFocusSeconds,
    }),
    [
      user,
      hasCompletedCareerDiscovery,
      recommendedCareerId,
      completedTasks,
      completionByDate,
      mentorActivityByDate,
      focusSecondsByDate,
      loading,
      refresh,
      refreshDashboard,
      addCompletedTask,
      incrementMentorActivity,
      addFocusSeconds,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

