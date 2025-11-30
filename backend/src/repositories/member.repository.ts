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
    // If no roles provided, automatically assign @everyone role
    let finalRoleIds = roleIds;
    if (roleIds.length === 0) {
      const everyoneRole = await this.prisma.role.findFirst({
        where: { serverId, name: '@everyone' }
      });
      if (everyoneRole) {
        finalRoleIds = [everyoneRole.id];
      }
    }

    return this.prisma.member.create({
      data: {
        userId,
        serverId,
        roleIds: finalRoleIds
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
  ): Promise<MemberWithUser> {
    const updateData: any = { ...data };
    
    // Handle roles relation if roleIds is present
    if (data.roleIds) {
        updateData.roles = {
            set: data.roleIds.map(id => ({ id }))
        };
        // Keep the scalar roleIds in sync if it exists in schema
        updateData.roleIds = data.roleIds;
    }

    return this.prisma.member.update({
      where: { userId_serverId: { userId, serverId } },
      data: updateData,
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
   * Vérifie si un membre a une permission spécifique
   */
  async hasPermission(
    userId: string,
    serverId: string,
    permission: string
  ): Promise<boolean> {
    const member = await this.findByUserAndServer(userId, serverId, true);
    
    if (!member) return false;
    
    // 1. Check owner via server repo (could be circular, so we rely on roles here OR add owner check logic if needed)
    // Ideally, owner should have an invisible 'root' permission or just check server.ownerId.
    // But for now, let's assume owner always has Admin role or we fetch server.
    const server = await this.prisma.server.findUnique({ where: { id: serverId }, select: { ownerId: true } });
    if (server && server.ownerId === userId) return true;

    // 2. Fetch @everyone role for this server
    const everyoneRole = await this.prisma.role.findFirst({
      where: { serverId, name: '@everyone' }
    });

    const rolesToCheck = [...(member.roles || [])];
    if (everyoneRole) rolesToCheck.push(everyoneRole);

    // 3. Administrator bypass
    if (rolesToCheck.some(role => role.permissions.includes('ADMINISTRATOR'))) {
      return true;
    }

    // 4. Check specific permission across all roles (including @everyone)
    return rolesToCheck.some(role => role.permissions.includes(permission));
  }

  /**
   * Compte le nombre de membres d'un serveur
   */
  async countByServerId(serverId: string): Promise<number> {
    return this.prisma.member.count({
      where: { serverId }
    });
  }

  /**
   * Récupère tous les serveurs dont l'utilisateur est membre
   */
  async findUserServers(userId: string): Promise<string[]> {
    const members = await this.prisma.member.findMany({
      where: { userId },
      select: { serverId: true }
    });
    return members.map(m => m.serverId);
  }
}

export const memberRepository = new MemberRepository();
