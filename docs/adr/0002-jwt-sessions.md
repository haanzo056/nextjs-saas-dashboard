# 2. JWT sessions, membership checked per request

Date: 2026-09-26
Status: accepted

## Context

Auth is NextAuth v4 with two providers: email/password (credentials) and GitHub OAuth. NextAuth only supports the credentials provider with the `jwt` session strategy and errors out if you combine it with database sessions.

Workspace roles change at runtime (promote, demote, remove), and a removed member must lose access immediately.

## Decision

- `session.strategy = 'jwt'`. The Prisma adapter is still used so GitHub accounts get linked to `User` rows.
- The token only carries the user id. Workspace membership and role are never put in the JWT; `requireMembership()` looks them up on every request (memoised per request with React `cache`).
- The route handler and every server action re-check permissions themselves instead of trusting that the page that rendered the button already did.

## Consequences

- Role changes and removals take effect on the next request with no token refresh logic.
- One extra indexed query per request. Acceptable.
- Sessions can't be revoked server-side before the JWT expires (default 30 days). Signing out only clears the cookie. If that matters later, add a `tokenVersion` column on `User` and compare it in the `jwt` callback.
- Middleware only checks that a token exists. It doesn't know about workspaces, which keeps it edge-compatible and free of DB calls.
