'use client';

import { useState } from 'react';
import { MetricCard } from '@/components/metric-card';
import { RangePicker } from '@/components/range-picker';
import { TrafficChart } from '@/components/traffic-chart';
import { Card, CardHeader } from '@/components/ui/card';
import { useMetrics } from '@/hooks/use-metrics';
import { conversionRate, type MetricsSummary } from '@/lib/metrics';
import { formatCurrency, formatNumber, percentChange } from '@/lib/utils';
import type { Range } from '@/lib/validators';

export function Dashboard({
  slug,
  initialRange,
  initialData,
}: {
  slug: string;
  initialRange: Range;
  initialData: MetricsSummary;
}) {
  const [range, setRange] = useState(initialRange);
  const { data, isFetching, isError, refetch } = useMetrics(slug, range, {
    range: initialRange,
    data: initialData,
  });

  function changeRange(next: Range) {
    setRange(next);
    // Keep the URL shareable without triggering a server round trip.
    const url = new URL(window.location.href);
    url.searchParams.set('range', next);
    window.history.replaceState(null, '', url);
  }

  if (isError || !data) {
    return (
      <Card className="p-6 text-sm">
        Couldn&apos;t load metrics.{' '}
        <button onClick={() => refetch()} className="text-brand-600 underline">
          Retry
        </button>
      </Card>
    );
  }

  const { current: c, previous: p } = data;
  const conv = conversionRate(c.signups, c.visitors);
  const prevConv = conversionRate(p.signups, p.visitors);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <RangePicker value={range} onChange={changeRange} />
        {isFetching && <span className="text-xs text-slate-400">Updating...</span>}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Visitors"
          value={formatNumber(c.visitors)}
          change={percentChange(c.visitors, p.visitors)}
        />
        <MetricCard
          label="Pageviews"
          value={formatNumber(c.pageviews)}
          change={percentChange(c.pageviews, p.pageviews)}
        />
        <MetricCard
          label="Signup rate"
          value={`${conv.toFixed(2)}%`}
          change={percentChange(conv, prevConv)}
        />
        <MetricCard
          label="Revenue"
          value={formatCurrency(c.revenue)}
          change={percentChange(c.revenue, p.revenue)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Traffic" />
          <div className="p-5">
            <TrafficChart data={data.series} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Top pages" />
          {data.topPages.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No pageviews in this range.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.topPages.map((page) => (
                <li key={page.path} className="flex justify-between px-5 py-2.5 text-sm">
                  <span className="truncate font-mono text-slate-700">{page.path}</span>
                  <span className="tabular-nums text-slate-500">{formatNumber(page.views)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
