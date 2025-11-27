import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  bio: z.string()
    .max(190, "La biographie ne peut pas dépasser 190 caractères")
    .optional()
    .transform(val => val?.trim())
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
