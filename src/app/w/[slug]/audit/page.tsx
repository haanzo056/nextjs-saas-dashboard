import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AuditTable } from '@/components/audit-table';
import { Card, CardHeader } from '@/components/ui/card';
import { db } from '@/lib/db';
import { can } from '@/lib/rbac';
import { requireMembership } from '@/lib/session';

export const metadata: Metadata = { title: 'Audit log' };

const PAGE_SIZE = 25;

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const { workspace, role } = await requireMembership(params.slug);
  if (!can(role, 'audit:read')) notFound();

  const page = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1);
  // Offset pagination is fine at this size. Switch to a (createdAt, id) cursor if logs get big.
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
    db.auditLog.count({ where: { workspaceId: workspace.id } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = `/w/${workspace.slug}/audit`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <Card>
        <CardHeader title="Activity" description={`${total} events`} />
        <AuditTable rows={rows} />
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm">
            <span className="text-slate-500">
              Page {page} of {pages}
            </span>
            <div className="flex gap-3">
              {page > 1 && <Link href={`${base}?page=${page - 1}`}>Newer</Link>}
              {page < pages && <Link href={`${base}?page=${page + 1}`}>Older</Link>}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
