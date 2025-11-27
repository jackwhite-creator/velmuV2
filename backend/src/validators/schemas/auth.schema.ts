import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string()
    .email("Email invalide")
    .max(255, "Email trop long"),
  username: z.string()
    .min(2, "Ton pseudo doit contenir au moins 2 caractères")
    .max(15, "Ton pseudo ne peut pas dépasser 15 caractères")
    .regex(/^[a-zA-Z0-9_\-. ]+$/, "Caractères autorisés : lettres, chiffres, _ - . et espace")
    .transform(val => val.trim().replace(/\s+/g, ' ')), // Normalise les espaces
  password: z.string()
    .min(8, "Ton mot de passe doit contenir au moins 8 caractères")
    .max(128, "Ton mot de passe ne peut pas dépasser 128 caractères")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Ton mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"),
  passwordConfirm: z.string(),
  captchaToken: z.string().min(1, "Valide le captcha pour continuer")
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Les mots de passe ne correspondent pas",
  path: ["passwordConfirm"]
});

export const LoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis")
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
