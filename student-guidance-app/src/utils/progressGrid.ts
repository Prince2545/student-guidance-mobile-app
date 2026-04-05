import type { DateCountMap } from './progressMetrics';
import { getDateKey } from './progressMetrics';

export type GridCell = {
  key: string;
  dateKey: string;
  count: number;
  intensity: 0 | 1 | 2 | 3;
};

export function buildActivityGrid(params: {
  completionByDate: DateCountMap;
  weeks: number;
  now?: Date;
}): GridCell[][] {
  const { completionByDate, weeks, now = new Date() } = params;
  const rows: GridCell[][] = [];
  const start = new Date(now);
  start.setDate(now.getDate() - (weeks * 7 - 1));

  for (let w = 0; w < weeks; w += 1) {
    const row: GridCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const dateKey = getDateKey(date);
      const count = completionByDate[dateKey] ?? 0;
      const intensity: 0 | 1 | 2 | 3 =
        count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
      row.push({
        key: `${dateKey}-${w}-${d}`,
        dateKey,
        count,
        intensity,
      });
    }
    rows.push(row);
  }

  return rows;
}

