import { z } from 'zod';

const EmbedFieldSchema = z.object({
  name: z.string().min(1).max(256),
  value: z.string().min(1).max(1024),
  inline: z.boolean().optional()
});

const EmbedFooterSchema = z.object({
  text: z.string().min(1).max(2048),
  iconUrl: z.string().url().optional()
});

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const MessageEmbedSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().min(1).max(4096).optional(),
  url: z.string().url().optional(),
  color: z.string().regex(hexColorRegex, 'Color must be a valid hex color (#RRGGBB)').optional(),
  thumbnail: z.string().url().optional(),
  image: z.string().url().optional(),
  fields: z.array(EmbedFieldSchema).max(25).optional(),
  footer: EmbedFooterSchema.optional(),
  timestamp: z.string().datetime().optional()
}).refine(
  (data) => {
    // Au moins un champ doit être présent
    return data.title || data.description || data.fields || data.image;
  },
  {
    message: 'Embed must have at least one of: title, description, fields, or image'
  }
);

export type MessageEmbedInput = z.infer<typeof MessageEmbedSchema>;
