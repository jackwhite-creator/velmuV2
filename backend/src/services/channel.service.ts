/**
 * Channel Service
 * Logique métier pour les channels et catégories
 */

import { channelRepository, memberRepository } from '../repositories';
import { ChannelType } from '@prisma/client';
import { AuthorizationError, NotFoundError, AppError } from '../middlewares/error.middleware';

export class ChannelService {
  /**
   * Crée un nouveau channel
   */
  async createChannel(
    serverId: string,
    userId: string,
    data: { name: string; type?: ChannelType; categoryId?: string }
  ) {
    // Vérifier que l'utilisateur est membre
    const isMember = await memberRepository.isMember(userId, serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    return channelRepository.createChannel({
      name: data.name,
      type: data.type || 'TEXT',
      serverId,
      categoryId: data.categoryId
    });
  }

  /**
   * Met à jour un channel
   */
  async updateChannel(
    channelId: string,
    userId: string,
    data: { name?: string; categoryId?: string | null; order?: number }
  ) {
    const channel = await channelRepository.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel introuvable');
    }

    const isMember = await memberRepository.isMember(userId, channel.serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    return channelRepository.updateChannel(channelId, data);
  }

  /**
   * Supprime un channel
   */
  async deleteChannel(channelId: string, userId: string) {
    const channel = await channelRepository.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel introuvable');
    }

    const isMember = await memberRepository.isMember(userId, channel.serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    await channelRepository.deleteChannel(channelId);
    return { message: 'Channel supprimé' };
  }

  /**
   * Crée une catégorie
   */
  async createCategory(serverId: string, userId: string, name: string) {
    const isMember = await memberRepository.isMember(userId, serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    return channelRepository.createCategory({ name, serverId });
  }

  /**
   * Met à jour une catégorie
   */
  async updateCategory(
    categoryId: string,
    userId: string,
    data: { name?: string; order?: number }
  ) {
    const category = await channelRepository.findCategoryById(categoryId);
    if (!category) {
      throw new NotFoundError('Catégorie introuvable');
    }

    const isMember = await memberRepository.isMember(userId, category.serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    return channelRepository.updateCategory(categoryId, data);
  }

  /**
   * Supprime une catégorie
   */
  async deleteCategory(categoryId: string, userId: string) {
    const category = await channelRepository.findCategoryById(categoryId);
    if (!category) {
      throw new NotFoundError('Catégorie introuvable');
    }

    const isMember = await memberRepository.isMember(userId, category.serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    await channelRepository.deleteCategory(categoryId);
    return { message: 'Catégorie supprimée' };
  }

  /**
   * Réorganise les channels
   */
  async reorderChannels(
    userId: string,
    updates: { id: string; order: number; categoryId?: string | null }[]
  ) {
    // Vérifier que l'utilisateur a accès (on vérifie le premier channel)
    if (updates.length > 0) {
      const firstChannel = await channelRepository.findById(updates[0].id);
      if (firstChannel) {
        const isMember = await memberRepository.isMember(userId, firstChannel.serverId);
        if (!isMember) {
          throw new AuthorizationError('Accès refusé');
        }
      }
    }

    await channelRepository.reorderChannels(updates);
    
    // Return serverId for socket emission
    if (updates.length > 0) {
        const firstChannel = await channelRepository.findById(updates[0].id);
        return { success: true, serverId: firstChannel?.serverId };
    }
    return { success: true };
  }

  /**
   * Réorganise les catégories
   */
  async reorderCategories(
    userId: string,
    updates: { id: string; order: number }[]
  ) {
    let serverId: string | undefined;

    // Vérifier que l'utilisateur a accès
    if (updates.length > 0) {
      const firstCat = await channelRepository.findCategoryById(updates[0].id);
      if (firstCat) {
        serverId = firstCat.serverId;
        const isMember = await memberRepository.isMember(userId, firstCat.serverId);
        if (!isMember) {
          throw new AuthorizationError('Accès refusé');
        }
      }
    }

    await channelRepository.reorderCategories(updates);
    return { success: true, serverId };
  }
}

export const channelService = new ChannelService();
