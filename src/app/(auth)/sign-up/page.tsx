import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUpForm } from './sign-up-form';

export const metadata: Metadata = { title: 'Create account' };

export default function SignUpPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const callbackUrl = searchParams.callbackUrl?.startsWith('/') ? searchParams.callbackUrl : '/';

  return (
    <>
      <h1 className="text-xl font-semibold">Create an account</h1>
      <p className="mt-1 text-sm text-slate-500">
        Already have one?{' '}
        <Link href="/sign-in" className="text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
      <SignUpForm callbackUrl={callbackUrl} />
    </>
  );
}
