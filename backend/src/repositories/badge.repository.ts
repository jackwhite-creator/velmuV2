/**
 * Badge Repository
 * Gestion des badges utilisateurs
 */

import { Badge, UserBadge } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class BadgeRepository extends BaseRepository<Badge> {
  constructor() {
    super('badge');
  }

  /**
   * Récupère tous les badges disponibles
   */
  async findAll(): Promise<Badge[]> {
    return this.prisma.badge.findMany({
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Trouve un badge par son nom
   */
  async findByName(name: string): Promise<Badge | null> {
    return this.prisma.badge.findUnique({
      where: { name }
    });
  }

  /**
   * Assigne un badge à un utilisateur
   */
  async assignToUser(userId: string, badgeId: string): Promise<UserBadge> {
    return this.prisma.userBadge.create({
      data: {
        userId,
        badgeId
      }
    });
  }

  /**
   * Retire un badge d'un utilisateur
   */
  async removeFromUser(userId: string, badgeId: string): Promise<void> {
    await this.prisma.userBadge.delete({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      }
    });
  }

  /**
   * Récupère les badges d'un utilisateur
   */
  async findUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      },
      orderBy: { assignedAt: 'asc' }
    });
  }

  /**
   * Crée un nouveau badge
   */
  async createBadge(data: { name: string; description?: string; iconUrl: string }): Promise<Badge> {
    return this.create(data);
  }
}

export const badgeRepository = new BadgeRepository();
