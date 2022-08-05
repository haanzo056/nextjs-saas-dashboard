import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { inviteStatus } from '@/lib/invites';
import { requireUser } from '@/lib/session';
import { acceptInvite } from './actions';

export const metadata: Metadata = { title: 'Invitation' };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </main>
  );
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const user = await requireUser();
  const invite = await db.invite.findUnique({
    where: { token: params.token },
    include: {
      workspace: { select: { name: true, slug: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  const status = invite ? inviteStatus(invite) : null;

  if (!invite || status === 'expired') {
    return (
      <Shell>
        <h1 className="text-lg font-semibold">This invite is no longer valid</h1>
        <p className="mt-2 text-sm text-slate-500">
          It may have expired or been revoked. Ask a workspace admin to send a new one.
        </p>
      </Shell>
    );
  }

  if (status === 'accepted') {
    return (
      <Shell>
        <h1 className="text-lg font-semibold">Invite already used</h1>
        <Link
          href={`/w/${invite.workspace.slug}`}
          className="mt-4 inline-block text-sm text-brand-600"
        >
          Go to {invite.workspace.name}
        </Link>
      </Shell>
    );
  }

  if (invite.email !== user.email?.toLowerCase()) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold">Wrong account</h1>
        <p className="mt-2 text-sm text-slate-500">
          This invite was sent to <strong>{invite.email}</strong>, but you&apos;re signed in as{' '}
          <strong>{user.email}</strong>. Sign in with the invited address to accept it.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-lg font-semibold">Join {invite.workspace.name}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {invite.invitedBy.name ?? invite.invitedBy.email} invited you as{' '}
        <span className="font-medium text-slate-700">{invite.role}</span>.
      </p>
      <form action={acceptInvite.bind(null, params.token)} className="mt-6">
        <Button type="submit" className="w-full">
          Accept invite
        </Button>
      </form>
    </Shell>
  );
}
