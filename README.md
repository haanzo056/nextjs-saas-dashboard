# Pulse

A multi-tenant product analytics dashboard. Users belong to workspaces with owner/admin/member roles, can invite teammates by link, and see traffic, signups and revenue for the workspace. Every membership change goes into a per-workspace audit log.

Stack: Next.js 14 (App Router), TypeScript, Prisma + SQLite, NextAuth, TanStack Query, Recharts, Tailwind, zod. Vitest and Playwright for tests.

There's no ingestion API yet. Events come from the seed script, so treat this as the dashboard half of an analytics product.

## Running it

Needs Node 20+.

```sh
cp .env.example .env        # set NEXTAUTH_SECRET to anything for local dev
npm install
npm run db:reset            # creates prisma/dev.db and seeds ~12k events
npm run dev
```

Sign in at http://localhost:3000 with `demo@pulse.dev` / `demo1234` (owner). The seed also creates `sam@pulse.dev` (admin) and `lee@pulse.dev` (member), same password, so you can check what each role sees.

GitHub login shows up only when `GITHUB_ID` and `GITHUB_SECRET` are set. The OAuth app callback URL is `http://localhost:3000/api/auth/callback/github`.

### Tests

```sh
npm test                    # vitest: rbac, metrics, utils, a few components
npm run test:e2e            # playwright, expects seeded db; starts `next dev` itself
```

### Docker

```sh
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" > .env
docker compose up -d --build
docker compose --profile seed run --rm seed    # optional demo data
```

The SQLite file lives in the `pulse-data` volume. The container runs `prisma db push` on start.

## Layout

```
prisma/              schema + seed
src/app/(auth)       sign-in / sign-up
src/app/w/[slug]     workspace pages (overview, members, audit, settings) and their server actions
src/app/api          nextauth, metrics route handler, health check
src/lib              rbac, session helpers, metrics aggregation, validators
src/components       ui bits and feature components
e2e/                 playwright specs
docs/adr/            decision records
```

## Notes on decisions

- Mutations are server actions, reads are server components. The one exception is the overview dashboard: it's server-rendered for the initial range, then TanStack Query fetches `/api/workspaces/[slug]/metrics` when you switch ranges. That keeps range switching snappy without re-rendering the whole page on the server.
- Permissions live in one table (`src/lib/rbac.ts`) and are checked again inside every action and the route handler. The UI hides things with the same functions, but that's cosmetic.
- Role is never stored in the session token. It's looked up per request, so demoting or removing someone takes effect immediately. See [ADR 2](docs/adr/0002-jwt-sessions.md).
- Non-members get a 404, not a 403, so workspace slugs can't be enumerated.
- SQLite keeps setup at zero. The schema doesn't depend on anything SQLite-specific except that roles are strings instead of enums. See [ADR 1](docs/adr/0001-sqlite-and-prisma.md).
- Workspace rename keeps the slug so old links keep working.

## Known issues / TODO

- Metrics aggregate raw events in memory on every request. Fine for the demo data, but it needs a daily rollup table (or Postgres + `date_trunc`) before real traffic.
- "Visitors" over a range is the sum of daily uniques, not true uniques.
- Invites aren't emailed; the inviter copies the link from the UI.
- No way to leave a workspace yourself, or to transfer ownership except by promoting someone and having them demote you.
- `npm start` warns about `output: standalone`. It still works; the Docker image uses the standalone server directly.
- Schema changes use `db push`. Switch to real migrations before anything with data you care about.
- No rate limiting on sign-in.
