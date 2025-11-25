import { prisma } from '../lib/prisma';

export const SocketGuard = {
  async validateChannelAccess(userId: string, channelId: string): Promise<boolean> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true }
    });

    if (!channel) return false;

    const membership = await prisma.member.findUnique({
      where: {
        userId_serverId: {
            userId: userId,
            serverId: channel.serverId
        }
      }
    });

    return !!membership;
  },

  async validateConversationAccess(userId: string, conversationId: string): Promise<boolean> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: { userId: userId }
        }
      }
    });

    return !!conversation;
  },

  async validateServerAccess(userId: string, serverId: string): Promise<boolean> {
    const membership = await prisma.member.findUnique({
      where: {
        userId_serverId: { userId, serverId }
      }
    });
    return !!membership;
  }
};