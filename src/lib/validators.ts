import { z } from 'zod';
import { ROLES } from './rbac';

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'At least 8 characters'),
});

export const workspaceSchema = z.object({
  name: z.string().trim().min(2, 'Too short').max(48),
});

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  role: z.enum(ROLES).exclude(['owner']),
});

export const roleUpdateSchema = z.object({
  membershipId: z.string().cuid(),
  role: z.enum(ROLES),
});

export const RANGES = ['7d', '30d', '90d'] as const;
export type Range = (typeof RANGES)[number];
export const rangeSchema = z.enum(RANGES).catch('30d');
