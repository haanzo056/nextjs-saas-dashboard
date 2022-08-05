'use client';

import { useState, useTransition } from 'react';
import { removeMember, updateRole } from '@/app/w/[slug]/members/actions';
import { canChangeRole, canRemove, ROLES } from '@/lib/rbac';
import { initials } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export type MemberRow = {
  id: string;
  role: string;
  userId: string;
  name: string | null;
  email: string;
  joinedAt: string;
};

export function MembersTable({
  slug,
  members,
  actorRole,
  actorId,
}: {
  slug: string;
  members: MemberRow[];
  actorRole: string;
  actorId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? 'Something went wrong.');
    });
  }

  return (
    <div>
      {error && (
        <p
          role="alert"
          className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-2 font-medium">Member</th>
            <th className="px-5 py-2 font-medium">Role</th>
            <th className="px-5 py-2 font-medium">Joined</th>
            <th className="px-5 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((m) => {
            const self = m.userId === actorId;
            const editable =
              !self && ROLES.some((r) => r !== m.role && canChangeRole(actorRole, m.role, r));
            return (
              <tr key={m.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {initials(m.name, m.email)}
                    </span>
                    <div>
                      <p className="font-medium">
                        {m.name ?? m.email} {self && <Badge className="ml-1">you</Badge>}
                      </p>
                      <p className="text-slate-500">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {editable ? (
                    // TODO: uncontrolled, so the select keeps showing a rejected value until reload.
                    <select
                      aria-label={`Role for ${m.email}`}
                      defaultValue={m.role}
                      disabled={pending}
                      onChange={(e) =>
                        run(() => updateRole(slug, { membershipId: m.id, role: e.target.value }))
                      }
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm capitalize"
                    >
                      {ROLES.filter((r) => r === m.role || canChangeRole(actorRole, m.role, r)).map(
                        (r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ),
                      )}
                    </select>
                  ) : (
                    <Badge tone={m.role === 'owner' ? 'blue' : 'gray'} className="capitalize">
                      {m.role}
                    </Badge>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {new Date(m.joinedAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  {!self && canRemove(actorRole, m.role) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        if (confirm(`Remove ${m.email} from this workspace?`)) {
                          run(() => removeMember(slug, m.id));
                        }
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
