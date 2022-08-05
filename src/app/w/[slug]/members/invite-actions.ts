'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { fail, guarded, type ActionResult } from '@/lib/actions';
import { audit } from '@/lib/audit';
import { db } from '@/lib/db';
import { generateInviteToken, inviteExpiry, inviteUrl } from '@/lib/invites';
import { requirePermission } from '@/lib/session';
import { inviteSchema } from '@/lib/validators';

export type InviteState = { error?: string; link?: string };

function origin() {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  const h = headers();
  return `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`;
}

export async function createInvite(
  slug: string,
  _prev: InviteState,
  form: FormData,
): Promise<InviteState> {
  let link: string | undefined;
  const res = await guarded(async () => {
    const { workspace, user } = await requirePermission(slug, 'members:invite');
    const parsed = inviteSchema.safeParse({ email: form.get('email'), role: form.get('role') });
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid input.');
    const { email, role } = parsed.data;

    const alreadyMember = await db.membership.findFirst({
      where: { workspaceId: workspace.id, user: { email } },
      select: { id: true },
    });
    if (alreadyMember) return fail(`${email} is already a member.`);

    const token = generateInviteToken();
    await db.$transaction(async (tx) => {
      // Re-inviting replaces any outstanding invite so there's only ever one live link.
      await tx.invite.deleteMany({
        where: { workspaceId: workspace.id, email, acceptedAt: null },
      });
      await tx.invite.create({
        data: {
          email,
          role,
          token,
          workspaceId: workspace.id,
          invitedById: user.id,
          expiresAt: inviteExpiry(),
        },
      });
      await audit(tx, {
        workspaceId: workspace.id,
        actorId: user.id,
        action: 'member.invited',
        target: email,
        meta: { role },
      });
    });

    // TODO: send this by email. For now the inviter copies the link from the UI.
    link = inviteUrl(token, origin());
    revalidatePath(`/w/${slug}/members`);
  });

  return res.ok ? { link } : { error: res.error };
}

export async function revokeInvite(slug: string, inviteId: string): Promise<ActionResult> {
  return guarded(async () => {
    const { workspace, user } = await requirePermission(slug, 'members:invite');
    const invite = await db.invite.findFirst({
      where: { id: inviteId, workspaceId: workspace.id, acceptedAt: null },
    });
    if (!invite) return fail('Invite not found.');

    await db.$transaction(async (tx) => {
      await tx.invite.delete({ where: { id: invite.id } });
      await audit(tx, {
        workspaceId: workspace.id,
        actorId: user.id,
        action: 'invite.revoked',
        target: invite.email,
      });
    });
    revalidatePath(`/w/${slug}/members`);
  });
}
