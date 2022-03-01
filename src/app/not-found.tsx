import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-medium text-slate-500">404</p>
      <h1 className="text-xl font-semibold">Nothing here</h1>
      <p className="max-w-sm text-sm text-slate-500">
        The page doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        Back to dashboard
      </Link>
    </main>
  );
}
