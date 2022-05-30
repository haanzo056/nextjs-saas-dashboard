import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { CreateWorkspaceForm } from './create-workspace-form';

export const metadata: Metadata = { title: 'New workspace' };

export default async function OnboardingPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold">Create a workspace</h1>
      <p className="mt-2 text-sm text-slate-500">
        Workspaces hold your events, dashboards and team. You can invite people once it exists.
      </p>
      <CreateWorkspaceForm defaultName={user.name ? `${user.name.split(' ')[0]}'s team` : ''} />
    </main>
  );
}
