/**
 * Server Service
 * Logique métier pour la gestion des serveurs
 */

import { serverRepository, memberRepository } from '../repositories';
import { ServerWithRelations, CreateServerRequest, UpdateServerRequest } from '../shared';
import { AuthorizationError, NotFoundError, AppError } from '../middlewares/error.middleware';

export class ServerService {
  /**
   * Récupère tous les serveurs d'un utilisateur
   */
  async getUserServers(userId: string) {
    return serverRepository.findByUserId(userId);
  }

  /**
   * Récupère un serveur avec vérification des permissions
   */
  async getServer(serverId: string, userId: string) {
    // Vérifier que l'utilisateur est membre
    const isMember = await memberRepository.isMember(userId, serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    const server = await serverRepository.findByIdWithRelations(serverId);
    if (!server) {
      throw new NotFoundError('Serveur introu vable');
    }

    return server;
  }

  /**
   * Crée un nouveau serveur avec setup initial
   */
  async createServer(userId: string, name: string, iconUrl: string | null = null) {
    if (!name || name.trim().length === 0) {
      throw new AppError(400, 'Le nom est requis');
    }

    return serverRepository.createWithSetup(name, userId, iconUrl);
  }

  /**
   * Met à jour un serveur
   */
  async updateServer(
    serverId: string, 
    userId: string, 
    data: { name?: string; iconUrl?: string; systemChannelId?: string | null }
  ) {
    // Vérifier que l'utilisateur est owner
    const isOwner = await serverRepository.isOwner(serverId, userId);
    if (!isOwner) {
      throw new AuthorizationError('Seul le propriétaire peut modifier ce serveur');
    }

    return serverRepository.updateServer(serverId, data);
  }

  /**
   * Supprime un serveur
   */
  async deleteServer(serverId: string, userId: string) {
    const isOwner = await serverRepository.isOwner(serverId, userId);
    if (!isOwner) {
      throw new AuthorizationError('Non autorisé');
    }

    const server = await serverRepository.findById(serverId);
    if (!server) {
      throw new NotFoundError('Serveur introuvable');
    }

    await serverRepository.delete(serverId);
    return { message: 'Serveur supprimé' };
  }

  /**
   * Quitter un serveur
   */
  async leaveServer(serverId: string, userId: string) {
    const server = await serverRepository.findById(serverId);
    if (!server) {
      throw new NotFoundError('Serveur introuvable');
    }

    // Le propriétaire ne peut pas quitter le serveur
    if (server.ownerId === userId) {
      throw new AppError(400, 'Le propriétaire ne peut pas quitter le serveur. Vous devez le supprimer.');
    }

    // Retirer le membre
    await memberRepository.removeMember(userId, serverId);
    
    return { message: 'Serveur quitté avec succès' };
  }

  /**
   * Récupère les invitations d'un serveur
   */
  async getServerInvites(serverId: string, userId: string) {
    // Vérifier que l'utilisateur est membre
    const isMember = await memberRepository.isMember(userId, serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    return serverRepository.getInvites(serverId);
  }

  /**
   * Supprime une invitation de serveur
   */
  async deleteServerInvite(serverId: string, inviteId: string, userId: string) {
    // Vérifier que l'utilisateur est membre
    const isMember = await memberRepository.isMember(userId, serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    // Note: Idéalement on devrait vérifier les permissions MANAGE_SERVER
    // Pour l'instant on laisse tous les membres gérer les invites

    const { inviteRepository } = require('../repositories/invite.repository');
    const invite = await inviteRepository.findById(inviteId);
    
    if (!invite || invite.serverId !== serverId) {
      throw new NotFoundError('Invitation introuvable');
    }

    await inviteRepository.deleteInvite(inviteId);
    return { success: true };
  }
}

export const serverService = new ServerService();
