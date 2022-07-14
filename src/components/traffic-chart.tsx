'use client';

import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyPoint } from '@/lib/metrics';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';

const SERIES = [
  { key: 'pageviews', label: 'Pageviews' },
  { key: 'visitors', label: 'Visitors' },
  { key: 'signups', label: 'Signups' },
  { key: 'revenue', label: 'Revenue' },
] as const;

type SeriesKey = (typeof SERIES)[number]['key'];

export function TrafficChart({ data }: { data: DailyPoint[] }) {
  const [metric, setMetric] = useState<SeriesKey>('pageviews');
  const fmt = (v: number) => (metric === 'revenue' ? formatCurrency(v) : formatNumber(v));

  return (
    <div>
      <div className="mb-4 flex gap-1" role="tablist">
        {SERIES.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={metric === s.key}
            onClick={() => setMetric(s.key)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium',
              metric === s.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => format(parseISO(d), 'MMM d')}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              labelFormatter={(d: string) => format(parseISO(d), 'EEE, MMM d')}
              formatter={(v: number) => fmt(v)}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
