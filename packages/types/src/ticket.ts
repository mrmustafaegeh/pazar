import { z } from 'zod';

export const ticketTypeSchema = z.enum([
  'LISTING_REPORT',
  'USER_COMPLAINT',
  'SUPPORT_REQUEST',
  'DATA_REQUEST',
]);

export const ticketStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export const ticketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTicketSchema = z.object({
  type: ticketTypeSchema,
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(5000),
  priority: ticketPrioritySchema.optional(),
  listingId: z.string().cuid().optional(),
  reportedUserId: z.string().cuid().optional(),
});

export const reportListingSchema = z.object({
  listingId: z.string().cuid(),
  reason: z.string().min(10).max(2000),
});

export const reportUserSchema = z.object({
  reportedUserId: z.string().cuid(),
  reason: z.string().min(10).max(2000),
});

export const kvkkDataExportSchema = z.object({
  confirmation: z.literal(true, {
    errorMap: () => ({ message: 'KVKK talebi için onay gerekli' }),
  }),
});

export const kvkkDeletionSchema = z.object({
  confirmation: z.literal(true, {
    errorMap: () => ({ message: 'Silme talebi için onay gerekli' }),
  }),
  reason: z.string().min(10).max(1000).optional(),
});

export const updateTicketSchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  justification: z.string().min(3).max(500),
});

export const ticketsQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  type: ticketTypeSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ReportListingInput = z.infer<typeof reportListingSchema>;
export type ReportUserInput = z.infer<typeof reportUserSchema>;
export type KvkkDataExportInput = z.infer<typeof kvkkDataExportSchema>;
export type KvkkDeletionInput = z.infer<typeof kvkkDeletionSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketsQuery = z.infer<typeof ticketsQuerySchema>;
