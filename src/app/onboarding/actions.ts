'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { workspaceSchema } from '@/lib/validators';
import { createWorkspace } from '@/lib/workspaces';

export type FormState = { error?: string };

export async function createWorkspaceAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = workspaceSchema.safeParse({ name: form.get('name') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid name' };

  const ws = await createWorkspace(user.id, parsed.data.name);
  redirect(`/w/${ws.slug}`);
}
