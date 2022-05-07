'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label } from '@/components/ui/input';

export function SignInForm({
  callbackUrl,
  github,
  oauthError,
}: {
  callbackUrl: string;
  github: boolean;
  oauthError: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    oauthError ? 'That email is already registered with a password.' : null,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    });

    if (!res || res.error) {
      setPending(false);
      setError('Invalid email or password.');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      {github && (
        <>
          <div className="relative text-center text-xs uppercase text-slate-400">
            <span className="bg-white px-2">or</span>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => signIn('github', { callbackUrl })}
          >
            Continue with GitHub
          </Button>
        </>
      )}
    </div>
  );
}
