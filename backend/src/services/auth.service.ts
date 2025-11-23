import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

export const AuthService = {
  // Inscription
  async register(email: string, username: string, password: string) {
    if (!email || !username || !password) {
      throw new Error('Tous les champs sont obligatoires');
    }
    if (password.length < 6) {
      throw new Error('Le mot de passe doit faire au moins 6 caractères');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Cet email est déjà utilisé');
    }

    const discriminator = Math.floor(1000 + Math.random() * 9000).toString();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const user = await prisma.user.create({
      data: { email, username, discriminator, passwordHash }
    });

    // On renvoie tout le profil, même si vide au début
    return { 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      discriminator: user.discriminator,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bio: user.bio
    };
  },

  // Connexion
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Identifiants invalides');

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new Error('Identifiants invalides');

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    // C'EST ICI QUE C'ETAIT INCOMPLET !
    // On renvoie maintenant les images et la bio au moment du login
    return { 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        discriminator: user.discriminator,
        avatarUrl: user.avatarUrl, // <--- Indispensable
        bannerUrl: user.bannerUrl, // <--- Indispensable
        bio: user.bio
      } 
    };
  }
};