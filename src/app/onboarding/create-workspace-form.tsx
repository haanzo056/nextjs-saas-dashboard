'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label } from '@/components/ui/input';
import { createWorkspaceAction } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create workspace'}
    </Button>
  );
}

export function CreateWorkspaceForm({ defaultName }: { defaultName: string }) {
  const [state, action] = useFormState(createWorkspaceAction, {});

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultName} required minLength={2} />
        <FieldError>{state.error}</FieldError>
      </div>
      <Submit />
    </form>
  );
}
