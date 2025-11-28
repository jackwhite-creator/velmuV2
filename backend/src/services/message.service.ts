/**
 * Message Service
 * Logique métier pour les messages
 */

import { messageRepository, channelRepository, conversationRepository, memberRepository, serverRepository } from '../repositories';
import { MessageType } from '@prisma/client';
import { AuthorizationError, NotFoundError } from '../middlewares/error.middleware';
import { Permissions } from '../shared/permissions';

export class MessageService {
  /**
   * Récupère les messages d'un channel
   */
  async getChannelMessages(channelId: string, userId: string, limit?: number, cursor?: string) {
    const channel = await channelRepository.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel introuvable');
    }

    // Vérifier que l'utilisateur est membre du serveur
    const isMember = await memberRepository.isMember(userId, channel.serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    return messageRepository.findByChannelId(channelId, limit, cursor);
  }

  /**
   * Crée un message dans un channel
   */
  async createChannelMessage(
    channelId: string,
    userId: string,
    data: {
      content: string;
      replyToId?: string;
      attachments?: { url: string; filename: string; type: string; size: number }[];
    }
  ) {
    const channel = await channelRepository.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel introuvable');
    }

    const isMember = await memberRepository.isMember(userId, channel.serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    let content = data.content;

    // Vérifier la permission @everyone
    if (content.includes('@everyone')) {
      const isOwner = await serverRepository.isOwner(channel.serverId, userId);
      if (!isOwner) {
        const hasPerm = await memberRepository.hasPermission(userId, channel.serverId, Permissions.MENTION_EVERYONE);
        if (!hasPerm) {
          // Neutraliser la mention si pas de permission (Zero Width Space)
          content = content.replace(/@everyone/g, '@\u200Beveryone');
        }
      }
    }

    return messageRepository.createMessage({
      content: content,
      userId,
      channelId,
      replyToId: data.replyToId,
      attachments: data.attachments
    });
  }

  /**
   * Récupère les messages d'une conversation
   */
  async getConversationMessages(conversationId: string, userId: string, limit?: number, cursor?: string) {
    const isMember = await conversationRepository.isMember(conversationId, userId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    return messageRepository.findByConversationId(conversationId, limit, cursor);
  }

  /**
   * Crée un message dans une conversation
   */
  async createConversationMessage(
    conversationId: string,
    userId: string,
    data: {
      content: string;
      replyToId?: string;
      attachments?: { url: string; filename: string; type: string; size: number }[];
    }
  ) {
    const isMember = await conversationRepository.isMember(conversationId, userId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    // Créer le message
    const message = await messageRepository.createMessage({
      content: data.content,
      userId,
      conversationId,
      replyToId: data.replyToId,
      attachments: data.attachments
    });

    // Mettre à jour lastMessageAt de la conversation
    await conversationRepository.updateLastMessageAt(conversationId);

    return message;
  }

  /**
   * Met à jour un message
   */
  async updateMessage(messageId: string, userId: string, content: string) {
    const isOwner = await messageRepository.isOwner(messageId, userId);
    if (!isOwner) {
      throw new AuthorizationError('Vous ne pouvez modifier que vos propres messages');
    }

    return messageRepository.updateMessage(messageId, content);
  }

  /**
   * Supprime un message
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message introuvable');
    }

    // Vérifier que c'est l'auteur ou un admin du serveur
    const isOwner = message.userId === userId;
    
    // TODO: Vérifier permissions admin si ce n'est pas l'auteur
    
    if (!isOwner) {
      throw new AuthorizationError('Accès refusé');
    }

    await messageRepository.deleteMessage(messageId);
    return message;
  }
}

export const messageService = new MessageService();
