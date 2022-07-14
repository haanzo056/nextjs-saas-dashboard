import { cn } from '@/lib/utils';

export function MetricCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: number | null;
}) {
  const direction =
    change === null ? 'none' : change > 0.05 ? 'up' : change < -0.05 ? 'down' : 'flat';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p
        data-direction={direction}
        className={cn(
          'mt-1 text-xs font-medium',
          direction === 'up' && 'text-emerald-600',
          direction === 'down' && 'text-red-600',
          (direction === 'flat' || direction === 'none') && 'text-slate-500',
        )}
      >
        {change === null
          ? 'No prior data'
          : `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs previous period`}
      </p>
    </div>
  );
}
