# 1. SQLite via Prisma for local dev and the demo

Date: 2026-09-26
Status: accepted

## Context

The app needs a relational store for users, workspaces, memberships, invites, the audit log and raw events. I want `git clone && npm i && npm run db:reset && npm run dev` to work with nothing else installed, and the Docker image to run on a single small host.

## Decision

Use Prisma with the SQLite provider. The schema stays portable: no raw SQL outside the health check, no SQLite-specific features. Schema changes go through `prisma db push` for now rather than migrations.

## Consequences

- Zero setup locally and in CI; the e2e job seeds a throwaway file database.
- Prisma doesn't support enums on SQLite, so `role` and `type` are strings. Valid values are enforced in app code (`src/lib/rbac.ts`, zod schemas). A bad row written by hand won't be rejected by the DB.
- Single writer. Fine for a demo; a real deployment with concurrent ingestion should move to Postgres. Switching means changing `provider`, turning the string columns into enums, and generating a proper baseline migration.
- Metrics are aggregated in JS from raw events (see `metrics-query.ts`). That's a separate problem from the DB choice, but SQLite makes it more noticeable past a few hundred thousand rows.
