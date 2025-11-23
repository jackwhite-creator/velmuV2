import { prisma } from '../lib/prisma';

export const ChatService = {
  /**
   * Récupère les messages d'un Channel
   */
  async getChannelMessages(channelId: string, cursor?: string, limit = 50) {
    return await prisma.message.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: { channelId }, // Filtre simple et efficace grâce à l'index
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
        attachments: true,
        replyTo: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } }
          }
        }
      }
    });
  },

  /**
   * Récupère les messages d'une Conversation (DM)
   */
  async getConversationMessages(conversationId: string, cursor?: string, limit = 50) {
    return await prisma.message.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: { conversationId }, // Filtre simple
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
        attachments: true,
        replyTo: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } }
          }
        }
      }
    });
  },

  /**
   * Crée un message (Logique unifiée pour Channel OU Conv)
   */
  async createMessage(data: {
    userId: string;
    content: string;
    fileData: { url: string; filename: string; type: string; size: number } | null;
    channelId?: string;
    conversationId?: string;
    replyToId?: string;
  }) {
    // Note: La validation des droits (Member/Friend) se fait dans le contrôleur maintenant
    // pour bien séparer la logique HTTP de la logique DB.

    return await prisma.message.create({
      data: {
        content: data.content,
        userId: data.userId,
        channelId: data.channelId || null,
        conversationId: data.conversationId || null,
        replyToId: data.replyToId || null,
        attachments: data.fileData ? {
          create: {
            url: data.fileData.url,
            filename: data.fileData.filename,
            type: data.fileData.type,
            size: data.fileData.size
          }
        } : undefined
      },
      include: {
        user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
        attachments: true,
        replyTo: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } }
          }
        }
      }
    });
  },
  
  // Update et Delete restent similaires, on peut les garder ici ou les refactoriser plus tard
  async deleteMessage(userId: string, messageId: string) {
      const msg = await prisma.message.findUnique({ where: { id: messageId }});
      if (!msg || msg.userId !== userId) throw new Error("Unauthorized");
      await prisma.message.delete({ where: { id: messageId }});
      return msg;
  }
};