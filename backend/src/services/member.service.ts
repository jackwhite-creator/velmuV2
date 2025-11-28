/**
 * Member Service
 * Logique métier pour les membres de serveurs
 */

import { memberRepository, serverRepository } from '../repositories';
import { AuthorizationError, NotFoundError } from '../middlewares/error.middleware';

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
    // Vérifier que l'utilisateur qui fait la requête est membre
    const isMember = await memberRepository.isMember(requestUserId, serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    // TODO: Vérifier permissions (MANAGE_MEMBERS, MANAGE_ROLES, etc.)

    // Vérifier que le membre cible existe
    const targetMember = await memberRepository.findByUserAndServer(targetUserId, serverId);
    if (!targetMember) {
      throw new NotFoundError('Membre introuvable');
    }

    return memberRepository.updateMember(targetUserId, serverId, data);
  }

  /**
   * Kick un membre du serveur
   */
  async kickMember(serverId: string, targetUserId: string, requestUserId: string) {
    // Vérifier que l'utilisateur est owner ou a les permissions
    const server = await serverRepository.findById(serverId);
    if (!server) {
      throw new NotFoundError('Serveur introuvable');
    }

    // Seul l'owner peut kick pour l'instant (TODO: permissions)
    if (server.ownerId !== requestUserId) {
      throw new AuthorizationError('Seul le propriétaire peut expulser des membres');
    }

    // Ne peut pas kick le owner
    if (server.ownerId === targetUserId) {
      throw new AuthorizationError('Impossible d\'expulser le propriétaire');
    }

    await memberRepository.removeMember(targetUserId, serverId);
    return { success: true };
  }

  /**
   * Vérifie si un utilisateur est membre d'un serveur
   */
  async isMember(userId: string, serverId: string): Promise<boolean> {
    return memberRepository.isMember(userId, serverId);
  }

  /**
   * Vérifie si un utilisateur a une permission
   */
  async hasPermission(userId: string, serverId: string, permission: string): Promise<boolean> {
    return memberRepository.hasPermission(userId, serverId, permission);
  }
}

export const memberService = new MemberService();
