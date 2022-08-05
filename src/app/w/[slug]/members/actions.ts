'use server';

import { revalidatePath } from 'next/cache';
import { fail, guarded } from '@/lib/actions';
import { audit } from '@/lib/audit';
import { db } from '@/lib/db';
import { canChangeRole, canRemove } from '@/lib/rbac';
import { requirePermission } from '@/lib/session';
import { roleUpdateSchema } from '@/lib/validators';

async function ownerCount(workspaceId: string) {
  return db.membership.count({ where: { workspaceId, role: 'owner' } });
}

export async function updateRole(slug: string, input: { membershipId: string; role: string }) {
  return guarded(async () => {
    const {
      workspace,
      role: actorRole,
      user,
    } = await requirePermission(slug, 'members:update-role');
    const parsed = roleUpdateSchema.safeParse(input);
    if (!parsed.success) return fail('Invalid role.');

    const target = await db.membership.findFirst({
      where: { id: parsed.data.membershipId, workspaceId: workspace.id },
      include: { user: { select: { email: true } } },
    });
    if (!target) return fail('Member not found.');
    if (target.role === parsed.data.role) return;
    if (!canChangeRole(actorRole, target.role, parsed.data.role)) {
      return fail("You can't change this member's role.");
    }
    if (target.role === 'owner' && (await ownerCount(workspace.id)) <= 1) {
      return fail('A workspace needs at least one owner.');
    }

    await db.$transaction(async (tx) => {
      await tx.membership.update({ where: { id: target.id }, data: { role: parsed.data.role } });
      await audit(tx, {
        workspaceId: workspace.id,
        actorId: user.id,
        action: 'member.role_changed',
        target: target.user.email,
        meta: { from: target.role, to: parsed.data.role },
      });
    });
    revalidatePath(`/w/${slug}/members`);
  });
}

export async function removeMember(slug: string, membershipId: string) {
  return guarded(async () => {
    const { workspace, role: actorRole, user } = await requirePermission(slug, 'members:remove');

    const target = await db.membership.findFirst({
      where: { id: membershipId, workspaceId: workspace.id },
      include: { user: { select: { email: true } } },
    });
    if (!target) return fail('Member not found.');
    if (target.userId === user.id) return fail("You can't remove yourself.");
    if (!canRemove(actorRole, target.role)) return fail("You can't remove this member.");
    if (target.role === 'owner' && (await ownerCount(workspace.id)) <= 1) {
      return fail('A workspace needs at least one owner.');
    }

    await db.$transaction(async (tx) => {
      await tx.membership.delete({ where: { id: target.id } });
      await audit(tx, {
        workspaceId: workspace.id,
        actorId: user.id,
        action: 'member.removed',
        target: target.user.email,
      });
    });
    revalidatePath(`/w/${slug}/members`);
  });
}
