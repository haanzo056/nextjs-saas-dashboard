export const ROLES = ['owner', 'admin', 'member'] as const;
export type Role = (typeof ROLES)[number];

const rank: Record<Role, number> = { member: 0, admin: 1, owner: 2 };

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function atLeast(role: string, required: Role): boolean {
  if (!isRole(role)) return false;
  return rank[role] >= rank[required];
}

const minRole = {
  'metrics:read': 'member',
  'audit:read': 'admin',
  'members:invite': 'admin',
  'members:remove': 'admin',
  'members:update-role': 'admin',
  'workspace:update': 'admin',
  'workspace:delete': 'owner',
} as const satisfies Record<string, Role>;

export type Permission = keyof typeof minRole;

export function can(role: string, perm: Permission): boolean {
  return atLeast(role, minRole[perm]);
}

// Admins can manage members but never touch owners or mint new ones.
// Whether the workspace would be left without an owner is checked separately, since it needs the DB.
export function canChangeRole(actor: string, currentRole: string, nextRole: string): boolean {
  if (!isRole(actor) || !isRole(currentRole) || !isRole(nextRole)) return false;
  if (!can(actor, 'members:update-role')) return false;
  if (actor === 'owner') return true;
  return currentRole !== 'owner' && nextRole !== 'owner';
}

export function canRemove(actor: string, targetRole: string): boolean {
  if (!can(actor, 'members:remove') || !isRole(targetRole)) return false;
  return actor === 'owner' || targetRole === 'member';
}
