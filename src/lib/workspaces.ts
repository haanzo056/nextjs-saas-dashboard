import { audit } from './audit';
import { db } from './db';
import { slugify } from './utils';

export function nextFreeSlug(base: string, taken: Iterable<string>) {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  let i = 2;
  while (set.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function createWorkspace(userId: string, name: string) {
  const base = slugify(name) || 'workspace';
  const existing = await db.workspace.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  // TODO: two concurrent creates with the same name can still collide here; the unique
  // index will reject the second one. Rare enough that a retry isn't worth it yet.
  const slug = nextFreeSlug(
    base,
    existing.map((w) => w.slug),
  );

  return db.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: { name, slug, memberships: { create: { userId, role: 'owner' } } },
    });
    await audit(tx, {
      workspaceId: ws.id,
      actorId: userId,
      action: 'workspace.created',
      target: name,
    });
    return ws;
  });
}

export function listWorkspacesFor(userId: string) {
  return db.workspace.findMany({
    where: { memberships: { some: { userId } } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });
}
