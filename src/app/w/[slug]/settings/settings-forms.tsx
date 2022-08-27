'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label } from '@/components/ui/input';
import type { ActionResult } from '@/lib/actions';

type Action = (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;

function Submit({ children, variant }: { children: string; variant?: 'primary' | 'danger' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {children}
    </Button>
  );
}

export function RenameForm({ action, name }: { action: Action; name: string }) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-3 p-5">
      <div className="max-w-sm">
        <Label htmlFor="ws-name">Workspace name</Label>
        <Input id="ws-name" name="name" defaultValue={name} required />
        <FieldError>{state && !state.ok ? state.error : null}</FieldError>
        {state?.ok && <p className="mt-1 text-sm text-emerald-600">Saved.</p>}
      </div>
      <Submit>Save</Submit>
    </form>
  );
}

export function DeleteForm({ action, slug }: { action: Action; slug: string }) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-3 p-5">
      <p className="text-sm text-slate-600">
        Permanently deletes the workspace, its events and audit history. Type{' '}
        <code className="rounded bg-slate-100 px-1">{slug}</code> to confirm.
      </p>
      <div className="max-w-sm">
        <Input name="confirm" aria-label="Confirm slug" autoComplete="off" />
        <FieldError>{state && !state.ok ? state.error : null}</FieldError>
      </div>
      <Submit variant="danger">Delete workspace</Submit>
    </form>
  );
}
