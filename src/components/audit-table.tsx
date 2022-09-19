import { format } from 'date-fns';
import { describeAudit } from '@/lib/audit';

export type AuditRow = {
  id: string;
  action: string;
  target: string | null;
  meta: string | null;
  createdAt: Date;
  actor: { name: string | null; email: string } | null;
};

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  if (rows.length === 0) {
    return <p className="p-5 text-sm text-slate-500">Nothing here yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-5 py-2 font-medium">When</th>
          <th className="px-5 py-2 font-medium">Who</th>
          <th className="px-5 py-2 font-medium">What</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r.id}>
            <td
              className="whitespace-nowrap px-5 py-2.5 text-slate-500"
              title={r.createdAt.toISOString()}
            >
              {format(r.createdAt, 'MMM d, HH:mm')}
            </td>
            <td className="px-5 py-2.5">
              {r.actor ? (r.actor.name ?? r.actor.email) : 'deleted user'}
            </td>
            <td className="px-5 py-2.5 text-slate-700">{describeAudit(r)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
