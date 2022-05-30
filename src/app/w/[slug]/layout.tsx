import { Sidebar, type NavItem } from '@/components/sidebar';
import { UserMenu } from '@/components/user-menu';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { can } from '@/lib/rbac';
import { requireMembership } from '@/lib/session';
import { listWorkspacesFor } from '@/lib/workspaces';
import { Providers } from '../../providers';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { user, workspace, role } = await requireMembership(params.slug);
  const workspaces = await listWorkspacesFor(user.id);
  const base = `/w/${workspace.slug}`;

  const nav: NavItem[] = [
    { href: base, label: 'Overview' },
    { href: `${base}/members`, label: 'Members' },
  ];
  if (can(role, 'audit:read')) nav.push({ href: `${base}/audit`, label: 'Audit log' });
  if (can(role, 'workspace:update')) nav.push({ href: `${base}/settings`, label: 'Settings' });

  return (
    <Providers>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-4 border-r border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 px-1 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
            Pulse
          </div>
          <WorkspaceSwitcher current={workspace.slug} workspaces={workspaces} />
          <Sidebar items={nav} footer={<UserMenu name={user.name} email={user.email} />} />
        </aside>
        <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
      </div>
    </Providers>
  );
}
