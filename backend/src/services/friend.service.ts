/**
 * Friend Service
 * Logique métier pour les demandes d'amis
 */

import { friendRepository, userRepository } from '../repositories';
import { RequestStatus } from '@prisma/client';
import { NotFoundError, AppError, AuthorizationError } from '../middlewares/error.middleware';

export class FriendService {
  /**
   * Récupère toutes les demandes d'amis d'un utilisateur
   */
  async getFriendRequests(userId: string) {
    return friendRepository.findByUserId(userId);
  }

  /**
   * Envoie une demande d'ami
   */
  async sendFriendRequest(userId: string, username: string, discriminator: string) {
    // Chercher l'utilisateur cible
    const targetUser = await userRepository.findByUsernameAndDiscriminator(username, discriminator);
    if (!targetUser) {
      throw new NotFoundError('Utilisateur introuvable');
    }

    if (targetUser.id === userId) {
      throw new AppError(400, 'Vous ne pouvez pas vous ajouter vous-même en ami');
    }

    // Vérifier si une demande existe déjà
    const existing = await friendRepository.findBetweenUsers(userId, targetUser.id);
    if (existing) {
      if (existing.status === RequestStatus.PENDING) {
        throw new AppError(400, 'Une demande est déjà en attente');
      }
      if (existing.status === RequestStatus.ACCEPTED) {
        throw new AppError(400, 'Vous êtes déjà amis');
      }
    }

    return friendRepository.createRequest(userId, targetUser.id);
  }

  /**
   * Accepte ou refuse une demande d'ami
   */
  async updateFriendRequest(requestId: string, userId: string, status: RequestStatus) {
    const request = await friendRepository.findByIdWithUsers(requestId);
    if (!request) {
      throw new NotFoundError('Demande introuvable');
    }

    // Seul le destinataire peut accepter/refuser
    if (request.receiverId !== userId) {
      throw new AuthorizationError('Vous ne pouvez pas gérer cette demande');
    }

    return friendRepository.updateStatus(requestId, status);
  }

  /**
   * Supprime un ami ou annule une demande
   */
  async removeFriend(requestId: string, userId: string) {
    const request = await friendRepository.findByIdWithUsers(requestId);
    if (!request) {
      throw new NotFoundError('Demande introuvable');
    }

    // Vérifier que l'utilisateur est impliqué dans cette relation
    if (request.senderId !== userId && request.receiverId !== userId) {
      throw new AuthorizationError('Accès refusé');
    }

    await friendRepository.deleteRequest(requestId);
    return request;
  }

  /**
   * Vérifie si deux utilisateurs sont amis
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    return friendRepository.areFriends(userId1, userId2);
  }
}

export const friendService = new FriendService();
