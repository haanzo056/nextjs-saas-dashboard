import 'server-only';
import { db } from './db';
import { rangeWindow, summarize } from './metrics';
import type { Range } from './validators';

// FIXME: pulls raw events into memory and aggregates in JS. Fine for the seed (~20k rows)
// but this needs a daily rollup table before it sees real traffic.
export async function loadSummary(workspaceId: string, range: Range) {
  const now = new Date();
  const { prevStart, end } = rangeWindow(range, now);
  const events = await db.event.findMany({
    where: { workspaceId, createdAt: { gte: prevStart, lt: end } },
    select: { type: true, path: true, sessionId: true, amount: true, createdAt: true },
  });
  return summarize(events, range, now);
}
