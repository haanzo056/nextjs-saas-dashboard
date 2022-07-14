import type { Range } from './validators';

const DAY = 86_400_000;

export const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };

export type RawEvent = {
  type: string;
  path: string | null;
  sessionId: string;
  amount: number | null;
  createdAt: Date;
};

export type DailyPoint = {
  date: string;
  pageviews: number;
  visitors: number;
  signups: number;
  revenue: number;
};

export type Totals = Omit<DailyPoint, 'date'>;

export type MetricsSummary = {
  range: Range;
  series: DailyPoint[];
  current: Totals;
  previous: Totals;
  topPages: { path: string; views: number }[];
};

export function rangeWindow(range: Range, now = new Date()) {
  const days = RANGE_DAYS[range];
  // Buckets are keyed by UTC date (see dayKey), so the window has to start at UTC midnight
  // too. Using local midnight shifted every bar by a day for anyone east of UTC.
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const end = new Date(today.getTime() + DAY);
  const start = new Date(end.getTime() - days * DAY);
  const prevStart = new Date(start.getTime() - days * DAY);
  return { days, start, end, prevStart };
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function bucketByDay(events: RawEvent[], start: Date, days: number): DailyPoint[] {
  const buckets = new Map<string, DailyPoint & { sessions: Set<string> }>();
  for (let i = 0; i < days; i++) {
    const date = dayKey(new Date(start.getTime() + i * DAY));
    buckets.set(date, {
      date,
      pageviews: 0,
      visitors: 0,
      signups: 0,
      revenue: 0,
      sessions: new Set(),
    });
  }

  for (const e of events) {
    const b = buckets.get(dayKey(e.createdAt));
    if (!b) continue;
    if (e.type === 'pageview') {
      b.pageviews++;
      b.sessions.add(e.sessionId);
    } else if (e.type === 'signup') {
      b.signups++;
    } else if (e.type === 'purchase') {
      b.revenue += e.amount ?? 0;
    }
  }

  return [...buckets.values()].map(({ sessions, ...p }) => ({ ...p, visitors: sessions.size }));
}

// Visitors here are summed daily uniques, not uniques across the whole range.
// Good enough for a trend line; a real count would need HLL or a distinct query.
export function totals(points: DailyPoint[]): Totals {
  return points.reduce<Totals>(
    (acc, p) => ({
      pageviews: acc.pageviews + p.pageviews,
      visitors: acc.visitors + p.visitors,
      signups: acc.signups + p.signups,
      revenue: acc.revenue + p.revenue,
    }),
    { pageviews: 0, visitors: 0, signups: 0, revenue: 0 },
  );
}

export function topPages(events: RawEvent[], limit = 5) {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.type !== 'pageview' || !e.path) continue;
    counts.set(e.path, (counts.get(e.path) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([path, views]) => ({ path, views }));
}

export function conversionRate(signups: number, visitors: number) {
  return visitors === 0 ? 0 : (signups / visitors) * 100;
}

export function summarize(events: RawEvent[], range: Range, now = new Date()): MetricsSummary {
  const { days, start, prevStart } = rangeWindow(range, now);
  const current = events.filter((e) => e.createdAt >= start);
  const previous = events.filter((e) => e.createdAt >= prevStart && e.createdAt < start);
  const series = bucketByDay(current, start, days);

  return {
    range,
    series,
    current: totals(series),
    previous: totals(bucketByDay(previous, prevStart, days)),
    topPages: topPages(current),
  };
}
