/**
 * Channel Repository
 * Gestion des channels et catégories
 */

import { Channel, Category, ChannelType } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CategoryWithChannels } from '../shared/types';

export class ChannelRepository extends BaseRepository<Channel> {
  constructor() {
    super('channel');
  }

  /**
   * Récupère un channel par ID
   */
  async findChannelById(channelId: string): Promise<Channel | null> {
    return this.findById(channelId);
  }

  /**
   * Récupère tous les channels d'un serveur
   */
  async findByServerId(serverId: string): Promise<Channel[]> {
    return this.prisma.channel.findMany({
      where: { serverId },
      orderBy: { order: 'asc' }
    });
  }

  /**
   * Crée un channel
   */
  async createChannel(data: {
    name: string;
    type: ChannelType;
    serverId: string;
    categoryId?: string;
    order?: number;
  }): Promise<Channel> {
    return this.prisma.channel.create({
      data: {
        name: data.name,
        type: data.type,
        serverId: data.serverId,
        categoryId: data.categoryId,
        order: data.order ?? 0
      }
    });
  }

  /**
   * Met à jour un channel
   */
  async updateChannel(
    channelId: string,
    data: { name?: string; categoryId?: string | null; order?: number }
  ): Promise<Channel> {
    return this.update(channelId, data);
  }

  /**
   * Supprime un channel
   */
  async deleteChannel(channelId: string): Promise<void> {
    await this.delete(channelId);
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  /**
   * Récupère une catégorie par ID
   */
  async findCategoryById(categoryId: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id: categoryId }
    });
  }

  /**
   * Récupère les catégories d'un serveur avec leurs channels
   */
  async findCategoriesByServerId(serverId: string): Promise<CategoryWithChannels[]> {
    return this.prisma.category.findMany({
      where: { serverId },
      include: {
        channels: { orderBy: { order: 'asc' } }
      },
      orderBy: { order: 'asc' }
    }) as unknown as CategoryWithChannels[];
  }

  /**
   * Crée une catégorie
   */
  async createCategory(data: {
    name: string;
    serverId: string;
    order?: number;
  }): Promise<Category> {
    return this.prisma.category.create({
      data: {
        name: data.name,
        serverId: data.serverId,
        order: data.order ?? 0
      }
    });
  }

  /**
   * Met à jour une catégorie
   */
  async updateCategory(
    categoryId: string,
    data: { name?: string; order?: number }
  ): Promise<Category> {
    return this.prisma.category.update({
      where: { id: categoryId },
      data
    });
  }

  /**
   * Supprime une catégorie
   */
  async deleteCategory(categoryId: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id: categoryId }
    });
  }

  /**
   * Réorganise les channels (drag & drop)
   */
  async reorderChannels(updates: { id: string; order: number; categoryId?: string | null }[]): Promise<void> {
    await this.prisma.$transaction(
      updates.map(({ id, order, categoryId }) =>
        this.prisma.channel.update({
          where: { id },
          data: { order, ...(categoryId !== undefined && { categoryId }) }
        })
      )
    );
  }

  /**
   * Réorganise les catégories
   */
  async reorderCategories(updates: { id: string; order: number }[]): Promise<void> {
    await this.prisma.$transaction(
      updates.map(({ id, order }) =>
        this.prisma.category.update({
          where: { id },
          data: { order }
        })
      )
    );
  }
}

export const channelRepository = new ChannelRepository();
