'use client';

import { signOut } from 'next-auth/react';
import { initials } from '@/lib/utils';

export function UserMenu({ name, email }: { name?: string | null; email?: string | null }) {
  return (
    <div className="flex items-center gap-3 border-t border-slate-200 pt-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
        {initials(name, email)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name ?? email}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/sign-in' })}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
