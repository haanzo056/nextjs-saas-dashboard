import type { Metadata } from 'next';
import { loadSummary } from '@/lib/metrics-query';
import { requireMembership } from '@/lib/session';
import { rangeSchema } from '@/lib/validators';
import { Dashboard } from './dashboard';

export const metadata: Metadata = { title: 'Overview' };

export default async function OverviewPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { range?: string };
}) {
  const { workspace } = await requireMembership(params.slug);
  const range = rangeSchema.parse(searchParams.range);
  const initialData = await loadSummary(workspace.id, range);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{workspace.name}</h1>
      <Dashboard slug={workspace.slug} initialRange={range} initialData={initialData} />
    </div>
  );
}
