import type { Metadata } from 'next';
import { InviteForm } from '@/components/invite-form';
import { MembersTable } from '@/components/members-table';
import { PendingInvites } from '@/components/pending-invites';
import { Card, CardHeader } from '@/components/ui/card';
import { db } from '@/lib/db';
import { inviteStatus } from '@/lib/invites';
import { can } from '@/lib/rbac';
import { requireMembership } from '@/lib/session';
import { createInvite } from './invite-actions';

export const metadata: Metadata = { title: 'Members' };

export default async function MembersPage({ params }: { params: { slug: string } }) {
  const { workspace, role, user } = await requireMembership(params.slug);

  const members = await db.membership.findMany({
    where: { workspaceId: workspace.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const canInvite = can(role, 'members:invite');
  const invites = canInvite
    ? await db.invite.findMany({
        where: { workspaceId: workspace.id, acceptedAt: null },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Members</h1>
      <Card>
        <CardHeader title="Team" description={`${members.length} people in ${workspace.name}`} />
        <MembersTable
          slug={workspace.slug}
          actorRole={role}
          actorId={user.id}
          members={members.map((m) => ({
            id: m.id,
            role: m.role,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            joinedAt: m.createdAt.toISOString(),
          }))}
        />
      </Card>

      {canInvite && (
        <Card>
          <CardHeader title="Invite people" description="Links expire after 7 days." />
          <InviteForm action={createInvite.bind(null, workspace.slug)} />
          <PendingInvites
            slug={workspace.slug}
            invites={invites.map((i) => ({
              id: i.id,
              email: i.email,
              role: i.role,
              expiresAt: i.expiresAt.toISOString(),
              expired: inviteStatus(i) === 'expired',
            }))}
          />
        </Card>
      )}
    </div>
  );
}
