import { z } from 'zod';
import { RoleSchema } from './auth.js';

export const updateUserRolesSchema = z.object({
  roles: z.array(RoleSchema).min(1),
  justification: z.string().min(3).max(500),
});

export const suspendUserSchema = z.object({
  justification: z.string().min(3).max(500),
});

export const updateFeatureFlagSchema = z.object({
  enabled: z.boolean(),
  justification: z.string().min(3).max(500),
});

export const adminUsersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type UpdateUserRolesInput = z.infer<typeof updateUserRolesSchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;

export interface AdminAnalytics {
  users: { total: number; verified: number };
  listings: Record<string, number>;
  tickets: { open: number; inProgress: number; total: number };
  moderation: { pending: number };
}
