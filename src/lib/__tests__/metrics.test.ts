import { describe, expect, it } from 'vitest';
import {
  bucketByDay,
  conversionRate,
  rangeWindow,
  summarize,
  topPages,
  type RawEvent,
} from '../metrics';

const now = new Date('2024-03-10T15:30:00Z');

function ev(type: string, iso: string, extra: Partial<RawEvent> = {}): RawEvent {
  return { type, path: '/', sessionId: 's1', amount: null, createdAt: new Date(iso), ...extra };
}

describe('rangeWindow', () => {
  it('ends at the next UTC midnight and spans the range', () => {
    const w = rangeWindow('7d', now);
    expect(w.end.toISOString()).toBe('2024-03-11T00:00:00.000Z');
    expect(w.start.toISOString()).toBe('2024-03-04T00:00:00.000Z');
    expect(w.prevStart.toISOString()).toBe('2024-02-26T00:00:00.000Z');
  });
});

describe('bucketByDay', () => {
  it('fills empty days with zeros', () => {
    const { start } = rangeWindow('7d', now);
    const points = bucketByDay([], start, 7);
    expect(points).toHaveLength(7);
    expect(points[0]).toEqual({
      date: '2024-03-04',
      pageviews: 0,
      visitors: 0,
      signups: 0,
      revenue: 0,
    });
    expect(points[6]!.date).toBe('2024-03-10');
  });

  it('counts unique sessions per day as visitors', () => {
    const { start } = rangeWindow('7d', now);
    const points = bucketByDay(
      [
        ev('pageview', '2024-03-10T01:00:00Z', { sessionId: 'a' }),
        ev('pageview', '2024-03-10T02:00:00Z', { sessionId: 'a' }),
        ev('pageview', '2024-03-10T03:00:00Z', { sessionId: 'b' }),
        ev('signup', '2024-03-10T03:01:00Z'),
        ev('purchase', '2024-03-10T03:02:00Z', { amount: 4900 }),
      ],
      start,
      7,
    );
    expect(points[6]).toMatchObject({ pageviews: 3, visitors: 2, signups: 1, revenue: 4900 });
  });

  it('ignores events outside the window', () => {
    const { start } = rangeWindow('7d', now);
    const points = bucketByDay([ev('pageview', '2024-01-01T00:00:00Z')], start, 7);
    expect(points.every((p) => p.pageviews === 0)).toBe(true);
  });
});

describe('topPages', () => {
  it('sorts by views then path', () => {
    const events = [
      ev('pageview', '2024-03-10T00:00:00Z', { path: '/b' }),
      ev('pageview', '2024-03-10T00:00:00Z', { path: '/a' }),
      ev('pageview', '2024-03-10T00:00:00Z', { path: '/c' }),
      ev('pageview', '2024-03-10T00:00:00Z', { path: '/c' }),
      ev('signup', '2024-03-10T00:00:00Z', { path: '/c' }),
    ];
    expect(topPages(events, 2)).toEqual([
      { path: '/c', views: 2 },
      { path: '/a', views: 1 },
    ]);
  });
});

describe('summarize', () => {
  it('splits current and previous periods', () => {
    const events = [
      ev('pageview', '2024-03-09T12:00:00Z'),
      ev('pageview', '2024-03-09T13:00:00Z'),
      ev('pageview', '2024-03-01T12:00:00Z'),
    ];
    const s = summarize(events, '7d', now);
    expect(s.current.pageviews).toBe(2);
    expect(s.previous.pageviews).toBe(1);
    expect(s.series).toHaveLength(7);
  });
});

describe('conversionRate', () => {
  it('handles zero visitors', () => {
    expect(conversionRate(5, 0)).toBe(0);
    expect(conversionRate(5, 200)).toBe(2.5);
  });
});
