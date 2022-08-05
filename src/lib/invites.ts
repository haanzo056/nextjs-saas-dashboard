import { randomBytes } from 'node:crypto';

export const INVITE_TTL_DAYS = 7;

export function generateInviteToken() {
  return randomBytes(24).toString('base64url');
}

export function inviteExpiry(now = new Date()) {
  return new Date(now.getTime() + INVITE_TTL_DAYS * 86_400_000);
}

export type InviteStatus = 'pending' | 'accepted' | 'expired';

export function inviteStatus(
  invite: { acceptedAt: Date | null; expiresAt: Date },
  now = new Date(),
): InviteStatus {
  if (invite.acceptedAt) return 'accepted';
  return invite.expiresAt.getTime() <= now.getTime() ? 'expired' : 'pending';
}

export function inviteUrl(token: string, origin: string) {
  return new URL(`/invite/${token}`, origin).toString();
}
