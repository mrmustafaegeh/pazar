import { z } from 'zod';

export const attributeFieldSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'enum']),
  label: z.string().optional(),
  required: z.boolean().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  options: z.array(z.string()).optional(),
});

export const categoryAttributeSchema = z.object({
  fields: z.record(attributeFieldSchema),
});

export const createCategorySchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  parentId: z.string().cuid().optional(),
  sortOrder: z.number().int().optional(),
  attributeSchema: categoryAttributeSchema.optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryAttributeSchema = z.infer<typeof categoryAttributeSchema>;
