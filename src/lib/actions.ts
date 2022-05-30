import { ForbiddenError } from './session';

export type ActionResult = { ok: true } | { ok: false; error: string };

export const fail = (error: string): ActionResult => ({ ok: false, error });

// Server actions should hand the client a message rather than throw, otherwise the
// user gets the generic error boundary for something as ordinary as a missing role.
export async function guarded(fn: () => Promise<ActionResult | void>): Promise<ActionResult> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (err) {
    if (err instanceof ForbiddenError) return fail("You don't have permission to do that.");
    throw err;
  }
}
