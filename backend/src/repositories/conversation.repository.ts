/**
 * Conversation Repository
 * Gestion des conversations privées (DMs)
 */

import { Conversation, ConversationMember } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { ConversationListItem, ConversationWithMembers } from '../shared/types';

export class ConversationRepository extends BaseRepository<Conversation> {
  constructor() {
    super('conversation');
  }

  /**
   * Trouve une conversation entre deux utilisateurs
   */
  async findBetweenUsers(userId1: string, userId2: string): Promise<Conversation | null> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        members: {
          every: {
            OR: [{ userId: userId1 }, { userId: userId2 }]
          }
        }
      },
      include: {
        members: true
      }
    });

    // Trouver celle qui a exactement ces 2 utilisateurs
    return conversations.find(conv => {
      const userIds = conv.members.map(m => m.userId).sort();
      const targetIds = [userId1, userId2].sort();
      return userIds.length === 2 && userIds[0] === targetIds[0] && userIds[1] === targetIds[1];
    }) || null;
  }

  /**
   * Récupère toutes les conversations d'un utilisateur (non fermées)
   */
  async findByUserId(userId: string): Promise<ConversationListItem[]> {
    const members = await this.prisma.conversationMember.findMany({
      where: {
        userId,
        closed: false
      },
      include: {
        conversation: {
          include: {
            members: {
              where: {
                userId: { not: userId } // Exclure l'utilisateur actuel
              },
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    discriminator: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        conversation: {
          lastMessageAt: 'desc'
        }
      }
    });

    return members.map(member => {
      // Nombre de messages non lus
      const lastReadAt = new Date(member.lastReadAt);
      const lastMessageAt = new Date(member.conversation.lastMessageAt);
      const unreadCount = lastMessageAt > lastReadAt ? 1 : 0; // Simplifié

      return {
        id: member.conversation.id,
        lastMessageAt: member.conversation.lastMessageAt.toISOString(),
        unreadCount,
        users: member.conversation.members.map(m => m.user)
      };
    });
  }

  /**
   * Crée une nouvelle conversation entre deux utilisateurs
   */
  async createConversation(userId1: string, userId2: string): Promise<ConversationWithMembers> {
    const conversation = await this.prisma.conversation.create({
      data: {
        members: {
          create: [
            { userId: userId1 },
            { userId: userId2 }
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                discriminator: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    return conversation as ConversationWithMembers;
  }

  /**
   * Met à jour lastReadAt pour un utilisateur dans une conversation
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.prisma.conversationMember.updateMany({
      where: {
        conversationId,
        userId
      },
      data: {
        lastReadAt: new Date()
      }
    });
  }

  /**
   * Met à jour lastMessageAt d'une conversation
   */
  async updateLastMessageAt(conversationId: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date()
      }
    });
  }

  /**
   * Ferme une conversation pour un utilisateur
   */
  async closeForUser(conversationId: string, userId: string): Promise<void> {
    await this.prisma.conversationMember.updateMany({
      where: {
        conversationId,
        userId
      },
      data: {
        closed: true
      }
    });
  }

  /**
   * Rouvre une conversation pour un utilisateur
   */
  async reopenForUser(conversationId: string, userId: string): Promise<void> {
    await this.prisma.conversationMember.updateMany({
      where: {
        conversationId,
        userId
      },
      data: {
        closed: false
      }
    });
  }

  /**
   * Vérifie si un utilisateur fait partie d'une conversation
   */
  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId
      }
    });
    return member !== null;
  }

  /**
   * Récupère une conversation avec toutes ses relations
   */
  async findWithRelations(conversationId: string): Promise<ConversationWithMembers | null> {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                discriminator: true,
                avatarUrl: true
              }
            }
          }
        },
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                discriminator: true,
                avatarUrl: true
              }
            },
            attachments: true
          }
        }
      }
    }) as Promise<ConversationWithMembers | null>;
  }
}

export const conversationRepository = new ConversationRepository();
