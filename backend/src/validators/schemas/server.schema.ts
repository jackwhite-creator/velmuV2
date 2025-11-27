import { z } from 'zod';

const uuidSchema = z.string().uuid("ID invalide");

// Server Schemas
export const CreateServerSchema = z.object({
  name: z.string()
    .min(1, "Le nom du serveur est requis")
    .max(100, "Le nom du serveur ne peut pas dépasser 100 caractères")
    .trim()
});

export const UpdateServerSchema = z.object({
  name: z.string()
    .min(1, "Le nom du serveur est requis")
    .max(100, "Le nom du serveur ne peut pas dépasser 100 caractères")
    .trim()
    .optional()
});

// Category Schemas
export const CreateCategorySchema = z.object({
  name: z.string()
    .min(1, "Le nom de la catégorie est requis")
    .max(50, "Le nom de la catégorie ne peut pas dépasser 50 caractères")
    .trim(),
  serverId: uuidSchema
});

export const UpdateCategorySchema = z.object({
  name: z.string()
    .min(1, "Le nom de la catégorie est requis")
    .max(50, "Le nom de la catégorie ne peut pas dépasser 50 caractères")
    .trim()
    .optional(),
  order: z.number().int().min(0).optional()
});

// Channel Schemas
export const CreateChannelSchema = z.object({
  name: z.string()
    .min(1, "Le nom du salon est requis")
    .max(100, "Le nom du salon ne peut pas dépasser 100 caractères")
    .trim()
    .regex(/^[a-z0-9-]+$/, "Le nom du salon ne peut contenir que des lettres minuscules, chiffres et tirets"),
  type: z.enum(['TEXT', 'AUDIO', 'VIDEO']).default('TEXT'),
  serverId: uuidSchema,
  categoryId: uuidSchema.optional()
});

export const UpdateChannelSchema = z.object({
  name: z.string()
    .min(1, "Le nom du salon est requis")
    .max(100, "Le nom du salon ne peut pas dépasser 100 caractères")
    .trim()
    .regex(/^[a-z0-9-]+$/, "Le nom du salon ne peut contenir que des lettres minuscules, chiffres et tirets")
    .optional(),
  categoryId: uuidSchema.nullable().optional(),
  order: z.number().int().min(0).optional()
});

export type CreateServerInput = z.infer<typeof CreateServerSchema>;
export type UpdateServerInput = z.infer<typeof UpdateServerSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateChannelInput = z.infer<typeof CreateChannelSchema>;
export type UpdateChannelInput = z.infer<typeof UpdateChannelSchema>;
