'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fail, guarded, type ActionResult } from '@/lib/actions';
import { audit } from '@/lib/audit';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/session';
import { workspaceSchema } from '@/lib/validators';

// Renaming keeps the slug on purpose so existing links and bookmarks don't break.
export async function renameWorkspace(
  slug: string,
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const { workspace, user } = await requirePermission(slug, 'workspace:update');
    const parsed = workspaceSchema.safeParse({ name: form.get('name') });
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid name.');
    if (parsed.data.name === workspace.name) return;

    await db.$transaction(async (tx) => {
      await tx.workspace.update({ where: { id: workspace.id }, data: { name: parsed.data.name } });
      await audit(tx, {
        workspaceId: workspace.id,
        actorId: user.id,
        action: 'workspace.renamed',
        target: parsed.data.name,
        meta: { from: workspace.name },
      });
    });
    revalidatePath(`/w/${slug}`, 'layout');
  });
}

export async function deleteWorkspace(
  slug: string,
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const res = await guarded(async () => {
    const { workspace } = await requirePermission(slug, 'workspace:delete');
    if (form.get('confirm') !== workspace.slug) return fail('Type the workspace slug to confirm.');
    // Cascades to memberships, invites, events and the audit log itself.
    await db.workspace.delete({ where: { id: workspace.id } });
  });
  if (!res.ok) return res;
  redirect('/');
}
