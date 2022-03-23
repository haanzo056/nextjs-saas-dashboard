import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const db = new PrismaClient();

// Deterministic PRNG so the demo charts look the same after every reset.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;

const PATHS = [
  '/',
  '/',
  '/',
  '/pricing',
  '/pricing',
  '/docs',
  '/docs/getting-started',
  '/blog/launch',
  '/changelog',
  '/signup',
];
const PLANS = [1900, 4900, 4900, 9900];
const DAYS = 90;

function eventsFor(workspaceId: string, scale: number) {
  const rows: {
    workspaceId: string;
    type: string;
    path: string | null;
    sessionId: string;
    amount: number | null;
    createdAt: Date;
  }[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let d = DAYS - 1; d >= 0; d--) {
    const day = new Date(today.getTime() - d * 86_400_000);
    const weekday = day.getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.6 : 1;
    const growth = 1 + ((DAYS - d) / DAYS) * 0.8;
    const views = Math.round(int(60, 110) * weekend * growth * scale);

    for (let i = 0; i < views; i++) {
      const at = new Date(day.getTime() + int(0, 86_399) * 1000);
      const sessionId = `s_${day.getTime().toString(36)}_${int(0, Math.max(1, views / 3))}`;
      rows.push({
        workspaceId,
        type: 'pageview',
        path: pick(PATHS),
        sessionId,
        amount: null,
        createdAt: at,
      });

      if (rand() < 0.04) {
        rows.push({
          workspaceId,
          type: 'signup',
          path: '/signup',
          sessionId,
          amount: null,
          createdAt: at,
        });
        if (rand() < 0.3) {
          rows.push({
            workspaceId,
            type: 'purchase',
            path: null,
            sessionId,
            amount: pick(PLANS),
            createdAt: at,
          });
        }
      }
    }
  }
  return rows;
}

async function main() {
  await db.$transaction([
    db.event.deleteMany(),
    db.auditLog.deleteMany(),
    db.invite.deleteMany(),
    db.membership.deleteMany(),
    db.workspace.deleteMany(),
    db.account.deleteMany(),
    db.session.deleteMany(),
    db.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const [owner, admin, member] = await Promise.all([
    db.user.create({ data: { email: 'demo@pulse.dev', name: 'Dana Owens', passwordHash } }),
    db.user.create({ data: { email: 'sam@pulse.dev', name: 'Sam Patel', passwordHash } }),
    db.user.create({ data: { email: 'lee@pulse.dev', name: 'Lee Moreno', passwordHash } }),
  ]);

  const acme = await db.workspace.create({
    data: {
      name: 'Acme Analytics',
      slug: 'acme',
      memberships: {
        create: [
          { userId: owner.id, role: 'owner' },
          { userId: admin.id, role: 'admin' },
          { userId: member.id, role: 'member' },
        ],
      },
    },
  });
  const side = await db.workspace.create({
    data: {
      name: 'Side Project',
      slug: 'side-project',
      memberships: { create: [{ userId: owner.id, role: 'owner' }] },
    },
  });

  await db.invite.create({
    data: {
      email: 'new.hire@example.com',
      role: 'member',
      token: randomBytes(24).toString('base64url'),
      workspaceId: acme.id,
      invitedById: admin.id,
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    },
  });

  const ago = (days: number) => new Date(Date.now() - days * 86_400_000);
  await db.auditLog.createMany({
    data: [
      {
        workspaceId: acme.id,
        actorId: owner.id,
        action: 'workspace.created',
        target: 'Acme',
        createdAt: ago(60),
      },
      {
        workspaceId: acme.id,
        actorId: owner.id,
        action: 'member.invited',
        target: admin.email,
        meta: '{"role":"admin"}',
        createdAt: ago(58),
      },
      {
        workspaceId: acme.id,
        actorId: admin.id,
        action: 'invite.accepted',
        target: admin.email,
        meta: '{"role":"admin"}',
        createdAt: ago(57),
      },
      {
        workspaceId: acme.id,
        actorId: admin.id,
        action: 'member.invited',
        target: member.email,
        meta: '{"role":"member"}',
        createdAt: ago(30),
      },
      {
        workspaceId: acme.id,
        actorId: member.id,
        action: 'invite.accepted',
        target: member.email,
        meta: '{"role":"member"}',
        createdAt: ago(29),
      },
      {
        workspaceId: acme.id,
        actorId: owner.id,
        action: 'workspace.renamed',
        target: 'Acme Analytics',
        meta: '{"from":"Acme"}',
        createdAt: ago(12),
      },
      {
        workspaceId: acme.id,
        actorId: admin.id,
        action: 'member.invited',
        target: 'new.hire@example.com',
        meta: '{"role":"member"}',
        createdAt: ago(1),
      },
      {
        workspaceId: side.id,
        actorId: owner.id,
        action: 'workspace.created',
        target: 'Side Project',
        createdAt: ago(20),
      },
    ],
  });

  const events = [...eventsFor(acme.id, 1), ...eventsFor(side.id, 0.15)];
  // SQLite caps bound parameters per statement, so insert in chunks.
  for (let i = 0; i < events.length; i += 2000) {
    await db.event.createMany({ data: events.slice(i, i + 2000) });
  }

  console.log(`Seeded ${events.length} events. Sign in as demo@pulse.dev / demo1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
