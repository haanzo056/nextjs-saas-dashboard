import { describe, expect, it, vi } from 'vitest';
import { describeAudit } from '../audit';
import { generateInviteToken, inviteExpiry, inviteStatus, inviteUrl } from '../invites';
import { nextFreeSlug } from '../workspaces';

vi.mock('../db', () => ({ db: {} }));

describe('invites', () => {
  const now = new Date('2024-05-01T00:00:00Z');

  it('generates url-safe tokens', () => {
    const t = generateInviteToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(generateInviteToken()).not.toBe(t);
  });

  it('expires after 7 days', () => {
    expect(inviteExpiry(now).toISOString()).toBe('2024-05-08T00:00:00.000Z');
  });

  it('reports status', () => {
    const expiresAt = inviteExpiry(now);
    expect(inviteStatus({ acceptedAt: null, expiresAt }, now)).toBe('pending');
    expect(inviteStatus({ acceptedAt: null, expiresAt }, expiresAt)).toBe('expired');
    expect(inviteStatus({ acceptedAt: now, expiresAt: new Date(0) }, now)).toBe('accepted');
  });

  it('builds absolute links', () => {
    expect(inviteUrl('abc', 'https://pulse.example.com/')).toBe(
      'https://pulse.example.com/invite/abc',
    );
  });
});

describe('nextFreeSlug', () => {
  it('uses the base when free', () => {
    expect(nextFreeSlug('acme', ['acme-co'])).toBe('acme');
  });

  it('appends the first free suffix', () => {
    expect(nextFreeSlug('acme', ['acme', 'acme-2', 'acme-4'])).toBe('acme-3');
  });
});

describe('describeAudit', () => {
  it('formats role changes from meta', () => {
    expect(
      describeAudit({
        action: 'member.role_changed',
        target: 'lee@pulse.dev',
        meta: JSON.stringify({ from: 'member', to: 'admin' }),
      }),
    ).toBe('changed lee@pulse.dev from member to admin');
  });

  it('survives malformed meta', () => {
    expect(describeAudit({ action: 'member.invited', target: 'x@y.z', meta: '{nope' })).toBe(
      'invited x@y.z as member',
    );
  });

  it('falls back to the raw action', () => {
    expect(describeAudit({ action: 'something.new', target: null, meta: null })).toBe(
      'something.new',
    );
  });
});
