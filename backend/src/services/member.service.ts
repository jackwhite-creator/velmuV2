/**
 * Member Service
 * Logique métier pour les membres de serveurs
 */

import { memberRepository, serverRepository, roleRepository } from '../repositories';
import { AuthorizationError, NotFoundError, AppError } from '../middlewares/error.middleware';
import { Permissions } from '../shared/permissions';
import { checkRoleHierarchy } from '../middlewares/permissions.middleware';

export class MemberService {
  /**
   * Récupère tous les membres d'un serveur
   */
  async getServerMembers(serverId: string, userId: string) {
    // Vérifier que l'utilisateur est membre
    const isMember = await memberRepository.isMember(userId, serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    return memberRepository.findByServerId(serverId);
  }

  /**
   * Met à jour un membre (nickname, roles)
   */
  async updateMember(
    serverId: string,
    targetUserId: string,
    requestUserId: string,
    data: { nickname?: string | null; roleIds?: string[] }
  ) {
    const isMember = await memberRepository.isMember(requestUserId, serverId);
    if (!isMember) throw new AuthorizationError('Accès refusé');

    const targetMember = await memberRepository.findByUserAndServer(targetUserId, serverId);
    if (!targetMember) throw new NotFoundError('Membre introuvable');

    // Role assignment logic with hierarchy check
    if (data.roleIds) {
        // 1. Check if actor has MANAGE_ROLES
        const canManageRoles = await memberRepository.hasPermission(requestUserId, serverId, Permissions.MANAGE_ROLES);
        if (!canManageRoles) throw new AuthorizationError("Permission MANAGE_ROLES requise");

        // 2. Hierarchy check: Cannot manage user with higher/equal role
        if (requestUserId !== targetUserId) { // Allow self-update? Usually not for roles.
             const isHigher = await checkRoleHierarchy(requestUserId, targetUserId, serverId);
             if (!isHigher) throw new AuthorizationError("Vous ne pouvez pas modifier les rôles d'un membre supérieur ou égal à vous.");
        }

        // 3. Check every role being added/removed
        const actorMember = await memberRepository.findByUserAndServerWithRelations(requestUserId, serverId);
        const actorHighestPos = Math.max(...(actorMember?.roles?.map(r => r.position) || [0]));
        const isOwner = (await serverRepository.findById(serverId))?.ownerId === requestUserId;

        if (!isOwner) {
             const targetRoles = await roleRepository.findMany({ serverId, id: { in: data.roleIds } });
             for (const role of targetRoles) {
                 if (role.position >= actorHighestPos) {
                     throw new AuthorizationError(`Vous ne pouvez pas assigner le rôle '${role.name}' car il est supérieur ou égal au vôtre.`);
                 }
             }
        }
    }

    return memberRepository.updateMember(targetUserId, serverId, data);
  }

  /**
   * Kick un membre du serveur
   */
  async kickMember(serverId: string, targetUserId: string, requestUserId: string) {
    const server = await serverRepository.findById(serverId);
    if (!server) throw new NotFoundError('Serveur introuvable');

    // 1. Permission check
    const canKick = await memberRepository.hasPermission(requestUserId, serverId, Permissions.KICK_MEMBERS);
    if (!canKick) throw new AuthorizationError('Permission KICK_MEMBERS manquante');

    // 2. Hierarchy check
    const isHigher = await checkRoleHierarchy(requestUserId, targetUserId, serverId);
    if (!isHigher) throw new AuthorizationError("Vous ne pouvez pas expulser un membre ayant un rôle supérieur ou égal au vôtre.");

    if (server.ownerId === targetUserId) throw new AuthorizationError('Impossible d\'expulser le propriétaire');

    await memberRepository.removeMember(targetUserId, serverId);
    return { success: true };
  }
}

export const memberService = new MemberService();
