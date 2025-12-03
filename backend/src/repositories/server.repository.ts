/**
 * Server Repository
 * Gestion des requêtes liées aux serveurs
 */

import { Server, Category, Channel, Member, Role } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { ServerWithRelations } from '../shared/types';
import { Permissions, DEFAULT_PERMISSIONS } from '../shared/permissions';

export class ServerRepository extends BaseRepository<Server> {
  constructor() {
    super('server');
  }

  /**
   * Récupère un serveur avec toutes ses relations
   */
  async findByIdWithRelations(serverId: string): Promise<ServerWithRelations | null> {
    return this.prisma.server.findUnique({
      where: { id: serverId },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            channels: { orderBy: { order: 'asc' } }
          }
        },
        channels: {
          where: { categoryId: null },
          orderBy: { order: 'asc' }
        },
        roles: { orderBy: { position: 'desc' } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                discriminator: true,
                avatarUrl: true,
                bio: true
              }
            },
            roles: true
          }
        }
      }
    }) as unknown as ServerWithRelations | null;
  }

  /**
   * Récupère tous les serveurs d'un utilisateur
   */
  async findByUserId(userId: string): Promise<Server[]> {
    const members = await this.prisma.member.findMany({
      where: { userId },
      include: { 
        server: {
          include: {
            roles: true,
            members: {
              where: { userId },
              include: { roles: true }
            }
          }
        } 
      }
    });
    return members.map(m => m.server);
  }

  /**
   * Crée un serveur avec setup initial (rôles, catégories, channels)
   */
  async createWithSetup(
    name: string,
    ownerId: string,
    iconUrl: string | null = null
  ): Promise<ServerWithRelations> {
    try {
      const server = await this.prisma.$transaction(async (tx) => {
        // 1. Créer le serveur
        const newServer = await tx.server.create({
          data: { name, iconUrl, ownerId }
        });

        // 2a. Créer le rôle @everyone (position 0)
        const everyoneRole = await tx.role.create({
          data: {
            name: "@everyone",
            color: "#99aab5",
            permissions: DEFAULT_PERMISSIONS,
            serverId: newServer.id,
            position: 0
          }
        });

        // 2b. Créer le rôle Admin (position 999)
        const adminRole = await tx.role.create({
          data: {
            name: "Admin",
            color: "#E91E63",
            permissions: [Permissions.ADMINISTRATOR],
            serverId: newServer.id,
            position: 999
          }
        });

        // 3. Ajouter le owner comme membre avec le rôle admin
        await tx.member.create({
          data: {
            userId: ownerId,
            serverId: newServer.id,
            roleIds: [adminRole.id],
            roles: {
              connect: [{ id: adminRole.id }]
            }
          }
        });

        // 4. Créer une catégorie par défaut
        const category = await tx.category.create({
          data: {
            name: "Salons textuels",
            serverId: newServer.id,
            order: 0
          }
        });

        // 5. Créer un channel général
        await tx.channel.create({
          data: {
            name: "général",
            type: "TEXT",
            serverId: newServer.id,
            categoryId: category.id,
            order: 0
          }
        });

        return newServer;
      });

      // Retourner le serveur complet avec relations
      return this.findByIdWithRelations(server.id) as Promise<ServerWithRelations>;
    } catch (error) {
      console.error('❌ Error creating server:', error);
      throw error;
    }
  }

  /**
   * Met à jour un serveur
   */
  async updateServer(
    serverId: string,
    data: { name?: string; iconUrl?: string; systemChannelId?: string | null }
  ): Promise<Server> {
    return this.prisma.server.update({
      where: { id: serverId },
      data
    });
  }

  /**
   * Vérifie si un utilisateur est owner du serveur
   */
  async isOwner(serverId: string, userId: string): Promise<boolean> {
    const server = await this.findById(serverId);
    return server?.ownerId === userId;
  }

  /**
   * Récupère les invitations d'un serveur
   */
  async getInvites(serverId: string) {
    return this.prisma.invite.findMany({
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
  }
}

export const serverRepository = new ServerRepository();
