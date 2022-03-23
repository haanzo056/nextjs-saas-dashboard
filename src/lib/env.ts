import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),
});

// Not failing hard on a missing NEXTAUTH_SECRET: `next build` evaluates this module in CI
// where secrets aren't set. next-auth itself refuses to run without one in production.
export const env = schema.parse(process.env);

export const githubEnabled = Boolean(env.GITHUB_ID && env.GITHUB_SECRET);
