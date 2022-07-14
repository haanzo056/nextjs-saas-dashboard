'use client';

import { cn } from '@/lib/utils';
import { RANGES, type Range } from '@/lib/validators';

const labels: Record<Range, string> = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };

export function RangePicker({
  value,
  onChange,
  disabled,
}: {
  value: Range;
  onChange: (r: Range) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Date range"
      className="inline-flex rounded-md border border-slate-300 bg-white p-0.5"
    >
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={value === r}
          disabled={disabled}
          onClick={() => r !== value && onChange(r)}
          className={cn(
            'rounded px-3 py-1 text-sm',
            value === r ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          {labels[r]}
        </button>
      ))}
    </div>
  );
}
