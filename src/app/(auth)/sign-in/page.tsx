import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { githubEnabled } from '@/lib/env';
import { getSession } from '@/lib/session';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const session = await getSession();
  // Only allow relative callback URLs so this can't be used as an open redirect.
  const callbackUrl = searchParams.callbackUrl?.startsWith('/') ? searchParams.callbackUrl : '/';
  if (session) redirect(callbackUrl);

  return (
    <>
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">
        No account?{' '}
        <Link
          href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-brand-600 hover:underline"
        >
          Create one
        </Link>
      </p>
      <SignInForm
        callbackUrl={callbackUrl}
        github={githubEnabled}
        oauthError={searchParams.error === 'OAuthAccountNotLinked'}
      />
    </>
  );
}
