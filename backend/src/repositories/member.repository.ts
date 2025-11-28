/**
 * Member Repository
 * Gestion des membres de serveurs et permissions
 */

import { Member, Role } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { MemberWithUser } from '../shared/types';

export class MemberRepository extends BaseRepository<Member> {
  constructor() {
    super('member');
  }

  /**
   * Trouve un membre par userId et serverId
   */
  async findByUserAndServer(
    userId: string,
    serverId: string,
    includeRoles: boolean = false
  ): Promise<(Member & { roles?: Role[] }) | null> {
    return this.prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
      ...(includeRoles && { include: { roles: true } })
    });
  }

  /**
   * Trouve un membre avec user et roles
   */
  async findByUserAndServerWithRelations(
    userId: string,
    serverId: string
  ): Promise<MemberWithUser | null> {
    return this.prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
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
    }) as Promise<MemberWithUser | null>;
  }

  /**
   * Récupère tous les membres d'un serveur
   */
  async findByServerId(serverId: string): Promise<MemberWithUser[]> {
    return this.prisma.member.findMany({
      where: { serverId },
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
    }) as Promise<MemberWithUser[]>;
  }

  /**
   * Vérifie si un utilisateur est membre d'un serveur
   */
  async isMember(userId: string, serverId: string): Promise<boolean> {
    const member = await this.findByUserAndServer(userId, serverId);
    return member !== null;
  }

  /**
   * Ajoute un membre à un serveur
   */
  async addMember(userId: string, serverId: string, roleIds: string[] = []): Promise<MemberWithUser> {
    return this.prisma.member.create({
      data: {
        userId,
        serverId,
        roleIds
      },
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
    }) as unknown as Promise<MemberWithUser>;
  }

  /**
   * Supprime un membre d'un serveur
   */
  async removeMember(userId: string, serverId: string): Promise<void> {
    await this.prisma.member.delete({
      where: { userId_serverId: { userId, serverId } }
    });
  }

  /**
   * Met à jour un membre (nickname, roles)
   */
  async updateMember(
    userId: string,
    serverId: string,
    data: { nickname?: string | null; roleIds?: string[] }
  ): Promise<Member> {
    return this.prisma.member.update({
      where: { userId_serverId: { userId, serverId } },
      data
    });
  }

  /**
   * Vérifie si un membre a une permission spécifique
   */
  async hasPermission(
    userId: string,
    serverId: string,
    permission: string
  ): Promise<boolean> {
    const member = await this.findByUserAndServer(userId, serverId, true);
    
    if (!member) return false;

    // Si le membre a des rôles avec ADMINISTRATOR, il a toutes les permissions
    if (member.roles?.some(role => role.permissions.includes('ADMINISTRATOR'))) {
      return true;
    }

    // Vérifie si un des rôles a la permission demandée
    return member.roles?.some(role => role.permissions.includes(permission)) || false;
  }

  /**
   * Compte le nombre de membres d'un serveur
   */
  async countByServerId(serverId: string): Promise<number> {
    return this.prisma.member.count({
      where: { serverId }
    });
  }
}

export const memberRepository = new MemberRepository();
