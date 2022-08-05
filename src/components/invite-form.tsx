'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { InviteState } from '@/app/w/[slug]/members/invite-actions';
import { Button } from './ui/button';
import { FieldError, Input, Label } from './ui/input';

type Action = (prev: InviteState, form: FormData) => Promise<InviteState>;

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Sending...' : 'Send invite'}
    </Button>
  );
}

export function InviteForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, {});
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.link) {
      formRef.current?.reset();
      setCopied(false);
    }
  }, [state.link]);

  return (
    <div className="space-y-3 p-5">
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="teammate@company.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            name="role"
            defaultValue="member"
            className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Submit />
      </form>
      <FieldError>{state.error}</FieldError>
      {state.link && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm">
          <span className="text-emerald-800">Invite created. Share this link:</span>
          <code className="min-w-0 flex-1 truncate text-xs text-slate-700">{state.link}</code>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(state.link!);
              setCopied(true);
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      )}
    </div>
  );
}
