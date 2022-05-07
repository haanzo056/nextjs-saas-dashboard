'use server';

import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signUpSchema } from '@/lib/validators';

export type SignUpResult = { ok: true } | { ok: false; fieldErrors: Record<string, string[]> };

export async function registerUser(input: unknown): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: false, fieldErrors: { email: ['Email is already registered'] } };

  await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });
  return { ok: true };
}
