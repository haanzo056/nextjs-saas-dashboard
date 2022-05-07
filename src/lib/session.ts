import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { authOptions } from './auth';
import { db } from './db';
import { can, type Permission, type Role } from './rbac';

export const getSession = cache(() => getServerSession(authOptions));

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/sign-in');
  return session.user;
}

// Cached per request so layout + page + actions don't each hit the DB for the same lookup.
export const requireMembership = cache(async (slug: string) => {
  const user = await requireUser();
  const membership = await db.membership.findFirst({
    where: { userId: user.id, workspace: { slug } },
    include: { workspace: true },
  });
  // 404 rather than 403 so workspace slugs can't be probed.
  if (!membership) notFound();

  return {
    user,
    workspace: membership.workspace,
    membership,
    role: membership.role as Role,
  };
});

export class ForbiddenError extends Error {
  constructor(perm: Permission) {
    super(`Missing permission: ${perm}`);
    this.name = 'ForbiddenError';
  }
}

export async function requirePermission(slug: string, perm: Permission) {
  const ctx = await requireMembership(slug);
  if (!can(ctx.role, perm)) throw new ForbiddenError(perm);
  return ctx;
}
