'use client';

import { signIn } from 'next-auth/react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label } from '@/components/ui/input';
import { registerUser } from './actions';

export function SignUpForm({ callbackUrl }: { callbackUrl: string }) {
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    startTransition(async () => {
      const res = await registerUser(values);
      if (!res.ok) {
        setErrors(res.fieldErrors);
        return;
      }
      await signIn('credentials', {
        email: values.email,
        password: values.password,
        callbackUrl,
      });
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required />
        <FieldError>{errors.name?.[0]}</FieldError>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError>{errors.email?.[0]}</FieldError>
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FieldError>{errors.password?.[0]}</FieldError>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
