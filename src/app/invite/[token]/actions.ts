'use server';

import { redirect } from 'next/navigation';
import { audit } from '@/lib/audit';
import { db } from '@/lib/db';
import { inviteStatus } from '@/lib/invites';
import { requireUser } from '@/lib/session';

export async function acceptInvite(token: string) {
  const user = await requireUser();
  const invite = await db.invite.findUnique({
    where: { token },
    include: { workspace: { select: { slug: true } } },
  });

  if (!invite || inviteStatus(invite) !== 'pending') redirect(`/invite/${token}`);
  if (invite.email !== user.email?.toLowerCase()) redirect(`/invite/${token}`);

  await db.$transaction(async (tx) => {
    // upsert in case they were added some other way between invite and accept
    await tx.membership.upsert({
      where: { userId_workspaceId: { userId: user.id, workspaceId: invite.workspaceId } },
      create: { userId: user.id, workspaceId: invite.workspaceId, role: invite.role },
      update: {},
    });
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    await audit(tx, {
      workspaceId: invite.workspaceId,
      actorId: user.id,
      action: 'invite.accepted',
      target: invite.email,
      meta: { role: invite.role },
    });
  });

  redirect(`/w/${invite.workspace.slug}`);
}
