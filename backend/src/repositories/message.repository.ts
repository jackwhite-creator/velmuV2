/**
 * Message Repository
 * Gestion des messages (channels et conversations)
 */

import { Message, Attachment, MessageType } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { MessageWithRelations } from '../shared/types';

export class MessageRepository extends BaseRepository<Message> {
  constructor() {
    super('message');
  }

  /**
   * Récupère les messages d'un channel avec pagination
   */
  async findByChannelId(
    channelId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<MessageWithRelations[]> {
    return this.prisma.message.findMany({
      where: { channelId },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      }),
      take: limit,
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
        attachments: true,
        replyTo: {
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
    }) as Promise<MessageWithRelations[]>;
  }

  /**
   * Récupère les messages d'une conversation avec pagination
   */
  async findByConversationId(
    conversationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<MessageWithRelations[]> {
    return this.prisma.message.findMany({
      where: { conversationId },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      }),
      take: limit,
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
        attachments: true,
        replyTo: {
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
    }) as Promise<MessageWithRelations[]>;
  }

  /**
   * Crée un message
   */
  async createMessage(data: {
    content: string;
    type?: MessageType;
    userId: string;
    channelId?: string;
    conversationId?: string;
    replyToId?: string;
    attachments?: { url: string; filename: string; type: string; size: number }[];
  }): Promise<MessageWithRelations> {
    const { attachments, ...messageData } = data;

    const message = await this.prisma.message.create({
      data: {
        ...messageData,
        type: messageData.type || 'DEFAULT',
        ...(attachments && attachments.length > 0 && {
          attachments: {
            create: attachments
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        },
        attachments: true,
        replyTo: {
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

    return message as MessageWithRelations;
  }

  /**
   * Met à jour un message
   */
  async updateMessage(messageId: string, content: string): Promise<MessageWithRelations> {
    const message = await this.prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        },
        attachments: true,
        replyTo: {
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
    return message as MessageWithRelations;
  }

  /**
   * Supprime un message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await this.delete(messageId);
  }

  /**
   * Récupère un message avec relations
   */
  async findMessageWithRelations(messageId: string): Promise<MessageWithRelations | null> {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        },
        attachments: true,
        replyTo: {
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
    }) as Promise<MessageWithRelations | null>;
  }

  /**
   * Vérifie si un message appartient à un utilisateur
   */
  async isOwner(messageId: string, userId: string): Promise<boolean> {
    const message = await this.findById(messageId);
    return message?.userId === userId;
  }
}

export const messageRepository = new MessageRepository();
