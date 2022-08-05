'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { useTransition } from 'react';
import { revokeInvite } from '@/app/w/[slug]/members/invite-actions';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

type Invite = { id: string; email: string; role: string; expiresAt: string; expired: boolean };

export function PendingInvites({ slug, invites }: { slug: string; invites: Invite[] }) {
  const [pending, start] = useTransition();

  if (invites.length === 0) {
    return <p className="px-5 pb-5 text-sm text-slate-500">No pending invites.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 border-t border-slate-100">
      {invites.map((inv) => (
        <li key={inv.id} className="flex items-center gap-3 px-5 py-3 text-sm">
          <span className="flex-1 truncate">{inv.email}</span>
          <Badge className="capitalize">{inv.role}</Badge>
          {inv.expired ? (
            <Badge tone="amber">expired</Badge>
          ) : (
            <span className="text-xs text-slate-500">
              expires in {formatDistanceToNowStrict(new Date(inv.expiresAt))}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => start(async () => void (await revokeInvite(slug, inv.id)))}
          >
            Revoke
          </Button>
        </li>
      ))}
    </ul>
  );
}
