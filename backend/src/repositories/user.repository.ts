/**
 * User Repository
 * Gestion des utilisateurs
 */

import { User } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { UserPublic } from '../shared/types';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('user');
  }

  /**
   * Trouve un utilisateur par email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Trouve un utilisateur par username et discriminator
   */
  async findByUsernameAndDiscriminator(
    username: string,
    discriminator: string
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        username_discriminator: { username, discriminator }
      }
    });
  }

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(data: {
    email: string;
    passwordHash: string;
    username: string;
    discriminator: string;
  }): Promise<User> {
    return this.create(data);
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(
    userId: string,
    data: {
      username?: string;
      bio?: string;
      avatarUrl?: string;
      bannerUrl?: string;
    }
  ): Promise<User> {
    return this.update(userId, data);
  }

  /**
   * Génère un discriminateur unique pour un username
   */
  async generateDiscriminator(username: string): Promise<string> {
    // Génère un nombre aléatoire entre 0001 et 9999
    for (let i = 0; i < 100; i++) {
      const discriminator = Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, '0');

      const exists = await this.findByUsernameAndDiscriminator(username, discriminator);
      if (!exists) {
        return discriminator;
      }
    }

    throw new Error('Impossible de générer un discriminateur unique');
  }

  /**
   * Récupère la version publique d'un utilisateur
   */
  async findPublicById(userId: string): Promise<UserPublic | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatarUrl: true,
        bio: true
      }
    });

    return user as UserPublic | null;
  }

  /**
   * Recherche des utilisateurs par username (pour autocomplete)
   */
  async searchByUsername(query: string, limit: number = 10): Promise<UserPublic[]> {
    const users = await this.prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatarUrl: true,
        bio: true
      },
      take: limit
    });

    return users as UserPublic[];
  }

  /**
   * Vérifie si un email existe déjà
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }
}

export const userRepository = new UserRepository();
