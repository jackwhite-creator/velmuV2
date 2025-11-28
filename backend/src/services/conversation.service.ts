/**
 * Conversation Service
 * Logique métier pour les conversations privées (DMs)
 */

import { conversationRepository, userRepository } from '../repositories';
import { AuthorizationError, NotFoundError, AppError } from '../middlewares/error.middleware';

export class ConversationService {
  /**
   * Récupère toutes les conversations d'un utilisateur
   */
  async getUserConversations(userId: string) {
    return conversationRepository.findByUserId(userId);
  }

  /**
   * Crée ou récupère une conversation avec un autre utilisateur
   */
  async createOrGetConversation(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new AppError(400, 'Vous ne pouvez pas créer une conversation avec vous-même');
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('Utilisateur introuvable');
    }

    // Chercher si une conversation existe déjà
    let conversation = await conversationRepository.findBetweenUsers(userId, targetUserId);

    if (conversation) {
      // Rouvrir la conversation si elle était fermée
      await conversationRepository.reopenForUser(conversation.id, userId);
      return conversationRepository.findWithRelations(conversation.id);
    }

    // Créer une nouvelle conversation
    return conversationRepository.createConversation(userId, targetUserId);
  }

  /**
   * Marque une conversation comme lue
   */
  async markAsRead(conversationId: string, userId: string) {
    const isMember = await conversationRepository.isMember(conversationId, userId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    await conversationRepository.markAsRead(conversationId, userId);
    return { success: true };
  }

  /**
   * Ferme une conversation pour un utilisateur
   */
  async closeConversation(conversationId: string, userId: string) {
    const isMember = await conversationRepository.isMember(conversationId, userId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    await conversationRepository.closeForUser(conversationId, userId);
    return { success: true };
  }

  /**
   * Récupère une conversation avec ses détails
   */
  async getConversation(conversationId: string, userId: string) {
    const isMember = await conversationRepository.isMember(conversationId, userId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    const conversation = await conversationRepository.findWithRelations(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation introuvable');
    }

    return conversation;
  }
}

export const conversationService = new ConversationService();
