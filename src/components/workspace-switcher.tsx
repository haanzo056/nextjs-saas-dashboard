'use client';

import { useRouter } from 'next/navigation';

type Ws = { id: string; name: string; slug: string };

export function WorkspaceSwitcher({ current, workspaces }: { current: string; workspaces: Ws[] }) {
  const router = useRouter();

  return (
    <select
      aria-label="Workspace"
      value={current}
      onChange={(e) => {
        const v = e.target.value;
        router.push(v === '__new' ? '/onboarding' : `/w/${v}`);
      }}
      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium"
    >
      {workspaces.map((w) => (
        <option key={w.id} value={w.slug}>
          {w.name}
        </option>
      ))}
      <option value="__new">+ New workspace</option>
    </select>
  );
}
