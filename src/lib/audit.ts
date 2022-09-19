import type { Prisma, PrismaClient } from '@prisma/client';

export type AuditAction =
  | 'workspace.created'
  | 'workspace.renamed'
  | 'member.invited'
  | 'invite.revoked'
  | 'invite.accepted'
  | 'member.role_changed'
  | 'member.removed';

type Client = PrismaClient | Prisma.TransactionClient;

export async function audit(
  client: Client,
  entry: {
    workspaceId: string;
    actorId: string | null;
    action: AuditAction;
    target?: string;
    meta?: Record<string, unknown>;
  },
) {
  await client.auditLog.create({
    data: {
      workspaceId: entry.workspaceId,
      actorId: entry.actorId,
      action: entry.action,
      target: entry.target,
      meta: entry.meta ? JSON.stringify(entry.meta) : null,
    },
  });
}

function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function describeAudit(entry: {
  action: string;
  target: string | null;
  meta: string | null;
}) {
  const meta = parseMeta(entry.meta);
  const t = entry.target ?? 'unknown';

  switch (entry.action) {
    case 'workspace.created':
      return `created workspace ${t}`;
    case 'workspace.renamed':
      return `renamed workspace from ${String(meta.from ?? '?')} to ${t}`;
    case 'member.invited':
      return `invited ${t} as ${String(meta.role ?? 'member')}`;
    case 'invite.revoked':
      return `revoked invite for ${t}`;
    case 'invite.accepted':
      return `joined as ${String(meta.role ?? 'member')}`;
    case 'member.role_changed':
      return `changed ${t} from ${String(meta.from)} to ${String(meta.to)}`;
    case 'member.removed':
      return `removed ${t}`;
    default:
      return entry.action;
  }
}
