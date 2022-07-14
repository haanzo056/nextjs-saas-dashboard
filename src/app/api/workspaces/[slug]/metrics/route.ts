import { getServerSession } from 'next-auth';
import { NextResponse, type NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { loadSummary } from '@/lib/metrics-query';
import { can } from '@/lib/rbac';
import { rangeSchema } from '@/lib/validators';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, workspace: { slug: params.slug } },
    select: { role: true, workspaceId: true },
  });
  if (!membership || !can(membership.role, 'metrics:read')) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const range = rangeSchema.parse(req.nextUrl.searchParams.get('range'));
  const summary = await loadSummary(membership.workspaceId, range);

  return NextResponse.json(summary, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}
