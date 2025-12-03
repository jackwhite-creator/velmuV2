/**
 * User Service
 * Logique métier pour les utilisateurs
 */

import { userRepository } from '../repositories';
import { NotFoundError, AppError } from '../middlewares/error.middleware';

export class UserService {
  /**
   * Récupère un utilisateur par ID
   * @param userId ID de l'utilisateur à récupérer
   * @param requesterId ID de l'utilisateur qui fait la requête (optionnel, pour les serveurs communs)
   */
  async getUserById(userId: string, requesterId?: string) {
    const user = await userRepository.findPublicById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable');
    }

    let mutualServers: any[] = [];
    if (requesterId && requesterId !== userId) {
        mutualServers = await userRepository.getMutualServers(requesterId, userId);
    }

    return { ...user, mutualServers };
  }

  /**
   * Met à jour le profil d'un utilisateur
   */
  async updateUser(
    userId: string,
    data: {
      username?: string;
      bio?: string;
      avatarUrl?: string;
      bannerUrl?: string;
    }
  ) {
    // Si le username change, vérifier la disponibilité
    if (data.username) {
      const currentUser = await userRepository.findById(userId);
      if (currentUser && data.username !== currentUser.username) {
        // Générer un nouveau discriminateur pour le nouveau username
        const discriminator = await userRepository.generateDiscriminator(data.username);
        return userRepository.updateUser(userId, { ...data, username: data.username });
      }
    }

    return userRepository.updateUser(userId, data);
  }

  /**
   * Recherche des utilisateurs
   */
  async searchUsers(query: string, limit: number = 10) {
    return userRepository.searchByUsername(query, limit);
  }

  /**
   * Récupère le profil complet d'un utilisateur
   */
  async getUserProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable');
    }

    return {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bio: user.bio,
      createdAt: user.createdAt
    };
  }
  /**
   * Récupère les serveurs de l'utilisateur connecté
   */
  async getUserServers(userId: string) {
    return userRepository.getUserServers(userId);
  }
}

export const userService = new UserService();
