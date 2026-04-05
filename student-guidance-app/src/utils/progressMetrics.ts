export type DateCountMap = Record<string, number>;

export const XP_PER_TASK = 40;
export const XP_PER_LEVEL = 100;

export function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTasksCompleted(completionByDate: DateCountMap): number {
  return Object.values(completionByDate).reduce((acc, n) => acc + n, 0);
}

export function getStreak(completionByDate: DateCountMap, now = new Date()): number {
  let streak = 0;
  const cursor = new Date(now);
  while (true) {
    const key = getDateKey(cursor);
    if ((completionByDate[key] ?? 0) > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }
  return streak;
}

export function getXpAndLevel(completedTasks: number): {
  xp: number;
  level: number;
  levelProgress: number;
} {
  const xp = completedTasks * XP_PER_TASK;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const levelProgress = xp % XP_PER_LEVEL;
  return { xp, level, levelProgress };
}

export function getLastNDaysKeys(days: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(getDateKey(d));
  }
  return keys;
}

export function getCurrentWeekKeys(now = new Date()): string[] {
  const day = now.getDay(); // 0 sunday
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  const keys: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    keys.push(getDateKey(d));
  }
  return keys;
}

