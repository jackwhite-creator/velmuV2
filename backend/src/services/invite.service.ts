/**
 * Invite Service
 * Logique métier pour les invitations
 */

import { inviteRepository, serverRepository, memberRepository } from '../repositories';
import { NotFoundError, AppError, AuthorizationError } from '../middlewares/error.middleware';
import { ServerWithRelations } from '../shared/types';

export class InviteService {
  /**
   * Crée une nouvelle invitation
   */
  async createInvite(
    serverId: string,
    userId: string,
    options: { maxUses?: number; expiresIn?: number } = {}
  ) {
    // Vérifier que le serveur existe
    const server = await serverRepository.findById(serverId);
    if (!server) {
      throw new NotFoundError('Serveur introuvable');
    }

    // Vérifier que l'utilisateur est membre
    const isMember = await memberRepository.isMember(userId, serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    // Générer un code unique
    const code = await inviteRepository.generateUniqueCode();

    // Calculer la date d'expiration si nécessaire
    let expiresAt: Date | undefined;
    if (options.expiresIn) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + options.expiresIn);
    }

    return inviteRepository.createInvite({
      code,
      serverId,
      creatorId: userId,
      maxUses: options.maxUses,
      expiresAt
    });
  }

  /**
   * Rejoint un serveur via un code d'invitation
   */
  async joinServer(code: string, userId: string) {
    // Chercher l'invitation
    const invite = await inviteRepository.findByCode(code);
    if (!invite) {
      throw new NotFoundError('Invitation invalide ou expirée');
    }

    // Vérifier que l'invitation est encore valide
    const isValid = await inviteRepository.isValid(invite);
    if (!isValid) {
      throw new AppError(400, 'Cette invitation a expiré ou a atteint sa limite d\'utilisations');
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const alreadyMember = await memberRepository.isMember(userId, invite.serverId);
    if (alreadyMember) {
      throw new AppError(400, 'Vous êtes déjà membre de ce serveur');
    }

    // Ajouter l'utilisateur au serveur
    const member = await memberRepository.addMember(userId, invite.serverId);

    // Incrémenter le compteur d'utilisations
    await inviteRepository.incrementUses(invite.id);

    // Retourner le serveur complet
    const server = await serverRepository.findByIdWithRelations(invite.serverId);
    if (!server) {
      throw new NotFoundError('Serveur introuvable');
    }

    // Créer un message système de bienvenue
    let welcomeMessage = null;
    try {
        const systemChannelId = server.systemChannelId;
        // Si un salon de bienvenue est configuré, on l'utilise
        // Sinon, on n'envoie rien (ou on garde le comportement par défaut si désiré, mais l'utilisateur veut que ce soit lié à l'option)
        if (systemChannelId) {
             const { messageRepository } = await import('../repositories/message.repository');
             welcomeMessage = await messageRepository.createMessage({
                 content: `${member.user.username}#${member.user.discriminator}`,
                 userId: member.userId, 
                 channelId: systemChannelId,
                 type: 'SYSTEM'
             });
        }
    } catch (e) {
        console.error("Failed to create welcome message", e);
    }

    return { server, member, welcomeMessage };
  }



  /**
   * Récupère une invitation par son code (avec infos du serveur)
   */
  async getInviteByCode(code: string) {
    const invite = await inviteRepository.findByCode(code);
    if (!invite) {
      throw new NotFoundError('Invitation introuvable');
    }

    const isValid = await inviteRepository.isValid(invite);
    if (!isValid) {
      throw new AppError(400, 'Cette invitation a expiré');
    }

    return invite;
  }

  /**
   * Supprime une invitation
   */
  async deleteInvite(inviteId: string, userId: string) {
    const invite = await inviteRepository.findById(inviteId);
    if (!invite) {
      throw new NotFoundError('Invitation introuvable');
    }

    // Vérifier que l'utilisateur a les droits
    const isMember = await memberRepository.isMember(userId, invite.serverId);
    if (!isMember) {
      throw new AuthorizationError('Accès refusé');
    }

    await inviteRepository.deleteInvite(inviteId);
    return { success: true };
  }
}

export const inviteService = new InviteService();
