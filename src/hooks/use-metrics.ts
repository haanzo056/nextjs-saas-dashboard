import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { MetricsSummary } from '@/lib/metrics';
import type { Range } from '@/lib/validators';

async function fetchMetrics(slug: string, range: Range): Promise<MetricsSummary> {
  const res = await fetch(`/api/workspaces/${slug}/metrics?range=${range}`);
  if (!res.ok) throw new Error(`Failed to load metrics (${res.status})`);
  return res.json();
}

export function useMetrics(
  slug: string,
  range: Range,
  initial?: { range: Range; data: MetricsSummary },
) {
  return useQuery({
    queryKey: ['metrics', slug, range],
    queryFn: () => fetchMetrics(slug, range),
    initialData: initial?.range === range ? initial.data : undefined,
    placeholderData: keepPreviousData,
  });
}
