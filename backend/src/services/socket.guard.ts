import { prisma } from '../lib/prisma';

export const SocketGuard = {
  /**
   * Vérifie si un utilisateur a le droit de rejoindre un Channel
   * Règle : L'utilisateur doit être membre du serveur auquel appartient le channel.
   */
  async validateChannelAccess(userId: string, channelId: string): Promise<boolean> {
    // 1. On cherche le channel et son serveur
    // Grâce à ta modif DB, on a accès direct au serverId !
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true }
    });

    if (!channel) return false;

    // 2. On vérifie si l'user est membre de ce serveur
    const membership = await prisma.member.findUnique({
      where: {
        userId_serverId: {
            userId: userId,
            serverId: channel.serverId
        }
      }
    });

    return !!membership; // Renvoie true si membre, false sinon
  },

  /**
   * Vérifie si un utilisateur a le droit de rejoindre une Conversation (DM)
   * Règle : L'utilisateur doit faire partie de la liste 'users' de la conversation.
   */
  async validateConversationAccess(userId: string, conversationId: string): Promise<boolean> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        users: {
          some: { id: userId }
        }
      }
    });

    return !!conversation;
  },

  /**
   * Vérifie si un user est membre d'un serveur (pour écouter les updates du serveur)
   */
  async validateServerAccess(userId: string, serverId: string): Promise<boolean> {
    const membership = await prisma.member.findUnique({
      where: {
        userId_serverId: { userId, serverId }
      }
    });
    return !!membership;
  }
};