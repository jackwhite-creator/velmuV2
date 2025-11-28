/**
 * Invite Repository
 * Gestion des invitations de serveurs
 */

import { Invite } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { InviteWithCreator } from '../shared/types';

export class InviteRepository extends BaseRepository<Invite> {
  constructor() {
    super('invite');
  }

  /**
   * Trouve une invitation par son code
   */
  async findByCode(code: string): Promise<InviteWithCreator | null> {
    const invite = await this.prisma.invite.findUnique({
      where: { code },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        },
        server: true
      }
    });

    return invite as InviteWithCreator | null;
  }

  /**
   * Crée une nouvelle invitation
   */
  async createInvite(data: {
    code: string;
    serverId: string;
    creatorId: string;
    maxUses?: number;
    expiresAt?: Date;
  }): Promise<Invite> {
    return this.create({
      code: data.code,
      serverId: data.serverId,
      creatorId: data.creatorId,
      maxUses: data.maxUses ?? 0,
      expiresAt: data.expiresAt
    });
  }

  /**
   * Incrémente le nombre d'utilisations d'une invitation
   */
  async incrementUses(inviteId: string): Promise<Invite> {
    return this.prisma.invite.update({
      where: { id: inviteId },
      data: {
        uses: { increment: 1 }
      }
    });
  }

  /**
   * Vérifie si une invitation est valide
   */
  async isValid(invite: { expiresAt: Date | string | null; maxUses: number; uses: number }): Promise<boolean> {
    // Vérifier expiration
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return false;
    }

    // Vérifier nombre max d'utilisations
    if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
      return false;
    }

    return true;
  }

  /**
   * Récupère toutes les invitations d'un serveur
   */
  async findByServerId(serverId: string): Promise<InviteWithCreator[]> {
    const invites = await this.prisma.invite.findMany({
      where: { serverId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return invites as InviteWithCreator[];
  }

  /**
   * Supprime une invitation
   */
  async deleteInvite(inviteId: string): Promise<void> {
    await this.delete(inviteId);
  }

  /**
   * Génère un code d'invitation unique
   */
  async generateUniqueCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    for (let i = 0; i < 10; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const exists = await this.prisma.invite.findUnique({
        where: { code }
      });

      if (!exists) {
        return code;
      }
    }

    throw new Error('Impossible de générer un code d\'invitation unique');
  }

  /**
   * Nettoie les invitations expirées
   */
  async cleanExpired(): Promise<number> {
    const result = await this.prisma.invite.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return result.count;
  }
}

export const inviteRepository = new InviteRepository();
