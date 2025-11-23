import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

export const ConversationController = {
  // 1. Initier un MP
  async getOrCreate(req: Request, res: Response) {
    try {
      const currentUserId = req.user?.userId;
      const { targetUserId } = req.body;

      if (!currentUserId || !targetUserId) return res.status(400).json({ error: "IDs manquants" });

      let conversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { users: { some: { id: currentUserId } } },
            { users: { some: { id: targetUserId } } }
          ]
        },
        include: {
          users: { select: { id: true, username: true, discriminator: true, avatarUrl: true } }
        }
      });

      // Création si n'existe pas
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            users: {
              connect: [
                { id: currentUserId },
                { id: targetUserId }
              ]
            }
          },
          include: {
            users: { select: { id: true, username: true, discriminator: true, avatarUrl: true } }
          }
        });

        // --- NOTIFICATION TEMPS RÉEL ---
        // On prévient l'autre utilisateur qu'une nouvelle conv est là !
        const io = req.app.get('io');
        // On envoie l'event "new_conversation" dans la room personnelle du targetUser
        io.to(targetUserId).emit('new_conversation', conversation);
      }

      res.json(conversation);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur conversation" });
    }
  },

  // 2. Lister mes conversations
  async getMyConversations(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Non auth" });

      const conversations = await prisma.conversation.findMany({
        where: {
          users: { some: { id: userId } }
        },
        include: {
          users: { select: { id: true, username: true, discriminator: true, avatarUrl: true, bio: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Erreur chargement conversations" });
    }
  }
};