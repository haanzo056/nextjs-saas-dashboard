'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type NavItem = { href: string; label: string };

export function Sidebar({ items, footer }: { items: NavItem[]; footer?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        // Overview is the workspace root, so it should only match exactly.
        const active =
          item.href.split('/').length <= 3
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium',
              active ? 'bg-slate-200/70 text-slate-900' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto">{footer}</div>
    </nav>
  );
}
