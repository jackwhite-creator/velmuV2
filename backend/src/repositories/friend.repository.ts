/**
 * Friend Repository
 * Gestion des demandes d'amis
 */

import { FriendRequest, RequestStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { FriendRequestWithUsers } from '../shared/types';

export class FriendRepository extends BaseRepository<FriendRequest> {
  constructor() {
    super('friendRequest');
  }

  /**
   * Récupère toutes les demandes d'amis d'un utilisateur (envoyées et reçues)
   */
  async findByUserId(userId: string): Promise<FriendRequestWithUsers[]> {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests as FriendRequestWithUsers[];
  }

  /**
   * Récupère les demandes acceptées (amis) d'un utilisateur
   */
  async findFriends(userId: string): Promise<FriendRequestWithUsers[]> {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: RequestStatus.ACCEPTED
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests as FriendRequestWithUsers[];
  }

  /**
   * Récupère les demandes en attente reçues
   */
  async findPendingReceived(userId: string): Promise<FriendRequestWithUsers[]> {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: RequestStatus.PENDING
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests as FriendRequestWithUsers[];
  }

  /**
   * Crée une demande d'ami
   */
  async createRequest(senderId: string, receiverId: string): Promise<FriendRequestWithUsers> {
    const request = await this.prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: RequestStatus.PENDING
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        }
      }
    });

    return request as FriendRequestWithUsers;
  }

  /**
   * Met à jour le statut d'une demande
   */
  async updateStatus(requestId: string, status: RequestStatus): Promise<FriendRequestWithUsers> {
    const request = await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        }
      }
    });

    return request as FriendRequestWithUsers;
  }

  /**
   * Supprime une demande d'ami ou un ami
   */
  async deleteRequest(requestId: string): Promise<void> {
    await this.delete(requestId);
  }

  /**
   * Trouve une demande entre deux utilisateurs
   */
  async findBetweenUsers(userId1: string, userId2: string): Promise<FriendRequest | null> {
    return this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ]
      }
    });
  }

  /**
   * Vérifie si deux utilisateurs sont amis
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ],
        status: RequestStatus.ACCEPTED
      }
    });

    return request !== null;
  }

  /**
   * Récupère une demande avec relations
   */
  async findByIdWithUsers(requestId: string): Promise<FriendRequestWithUsers | null> {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true
          }
        }
      }
    });

    return request as FriendRequestWithUsers | null;
  }
}

export const friendRepository = new FriendRepository();
