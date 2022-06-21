import { describe, expect, it } from 'vitest';
import { atLeast, can, canChangeRole, canRemove, isRole } from '../rbac';

describe('isRole', () => {
  it('only accepts known roles', () => {
    expect(isRole('admin')).toBe(true);
    expect(isRole('superuser')).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});

describe('atLeast', () => {
  it('orders owner > admin > member', () => {
    expect(atLeast('owner', 'admin')).toBe(true);
    expect(atLeast('admin', 'admin')).toBe(true);
    expect(atLeast('member', 'admin')).toBe(false);
  });

  it('rejects garbage roles from the db', () => {
    expect(atLeast('OWNER', 'member')).toBe(false);
  });
});

describe('can', () => {
  it.each([
    ['member', 'metrics:read', true],
    ['member', 'audit:read', false],
    ['member', 'members:invite', false],
    ['admin', 'members:invite', true],
    ['admin', 'workspace:update', true],
    ['admin', 'workspace:delete', false],
    ['owner', 'workspace:delete', true],
  ] as const)('%s / %s -> %s', (role, perm, expected) => {
    expect(can(role, perm)).toBe(expected);
  });
});

describe('canChangeRole', () => {
  it('lets owners do anything', () => {
    expect(canChangeRole('owner', 'member', 'owner')).toBe(true);
    expect(canChangeRole('owner', 'owner', 'admin')).toBe(true);
  });

  it('lets admins shuffle members and admins', () => {
    expect(canChangeRole('admin', 'member', 'admin')).toBe(true);
    expect(canChangeRole('admin', 'admin', 'member')).toBe(true);
  });

  it('stops admins from touching owners or promoting to owner', () => {
    expect(canChangeRole('admin', 'owner', 'member')).toBe(false);
    expect(canChangeRole('admin', 'member', 'owner')).toBe(false);
  });

  it('never lets members change roles', () => {
    expect(canChangeRole('member', 'member', 'admin')).toBe(false);
  });

  it('rejects unknown target roles', () => {
    expect(canChangeRole('owner', 'member', 'root')).toBe(false);
  });
});

describe('canRemove', () => {
  it('admins can only remove members', () => {
    expect(canRemove('admin', 'member')).toBe(true);
    expect(canRemove('admin', 'admin')).toBe(false);
    expect(canRemove('admin', 'owner')).toBe(false);
  });

  it('owners can remove anyone', () => {
    expect(canRemove('owner', 'admin')).toBe(true);
    expect(canRemove('owner', 'owner')).toBe(true);
  });

  it('members cannot remove', () => {
    expect(canRemove('member', 'member')).toBe(false);
  });
});
