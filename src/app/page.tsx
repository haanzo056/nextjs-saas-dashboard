import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/session';

export default async function Home() {
  const user = await requireUser();
  const first = await db.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: { workspace: { select: { slug: true } } },
  });

  redirect(first ? `/w/${first.workspace.slug}` : '/onboarding');
}
