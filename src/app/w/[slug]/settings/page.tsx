import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/card';
import { can } from '@/lib/rbac';
import { requireMembership } from '@/lib/session';
import { deleteWorkspace, renameWorkspace } from './actions';
import { DeleteForm, RenameForm } from './settings-forms';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage({ params }: { params: { slug: string } }) {
  const { workspace, role } = await requireMembership(params.slug);
  if (!can(role, 'workspace:update')) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader title="General" />
        <RenameForm action={renameWorkspace.bind(null, workspace.slug)} name={workspace.name} />
      </Card>

      {can(role, 'workspace:delete') && (
        <Card className="border-red-200">
          <CardHeader title="Danger zone" />
          <DeleteForm action={deleteWorkspace.bind(null, workspace.slug)} slug={workspace.slug} />
        </Card>
      )}
    </div>
  );
}
