import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const ConversationController = {
  async getOrCreate(req: Request, res: Response) {
    try {
      const currentUserId = req.user?.userId;
      const { targetUserId } = req.body;

      if (!currentUserId || !targetUserId) return res.status(400).json({ error: "IDs manquants" });

      let conversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { members: { some: { userId: currentUserId } } },
            { members: { some: { userId: targetUserId } } }
          ]
        },
        include: {
          members: {
            include: { user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } } }
          }
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            members: {
              create: [
                { userId: currentUserId, closed: false }, // Ouvert pour le créateur
                { userId: targetUserId, closed: true }    // Fermé par défaut pour le destinataire (tant qu'il n'y a pas de message)
              ]
            }
          },
          include: {
            members: {
              include: { user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } } }
            }
          }
        });
      } else {
        // Si la conversation existe mais était fermée pour moi, je la rouvre
        const member = conversation.members.find(m => m.userId === currentUserId);
        if (member && member.closed) {
            await prisma.conversationMember.update({
                where: { id: member.id },
                data: { closed: false }
            });
        }
      }

      const formattedResult = {
          ...conversation,
          users: conversation.members.map(m => m.user),
          unreadCount: 0
      };

      // Note : On n'émet PAS de socket ici. Le DM n'apparaîtra chez l'autre que lors du premier message.
      res.json(formattedResult);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur conversation" });
    }
  },

  async getMyConversations(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Non auth" });

      // On ne récupère que les conversations qui ne sont PAS fermées pour cet utilisateur
      const conversations = await prisma.conversation.findMany({
        where: {
          members: { 
            some: { 
                userId,
                closed: false // <--- FILTRE IMPORTANT
            } 
          }
        },
        include: {
          members: {
            include: {
                user: { select: { id: true, username: true, discriminator: true, avatarUrl: true, bio: true } }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
          const currentUserMember = conv.members.find(m => m.userId === userId);
          let unreadCount = 0;

          if (currentUserMember) {
              unreadCount = await prisma.message.count({
                  where: {
                      conversationId: conv.id,
                      createdAt: { gt: currentUserMember.lastReadAt },
                      userId: { not: userId } 
                  }
              });
          }

          return {
              ...conv,
              users: conv.members.map(m => m.user), 
              unreadCount 
          };
      }));

      res.json(conversationsWithUnread);
    } catch (error) {
      console.error("Erreur get convs:", error);
      res.status(500).json({ error: "Erreur chargement conversations" });
    }
  },

  async markAsRead(req: Request, res: Response) {
      try {
          const userId = req.user?.userId;
          const { conversationId } = req.params;

          await prisma.conversationMember.update({
              where: {
                  userId_conversationId: {
                      userId: userId!,
                      conversationId
                  }
              },
              data: { lastReadAt: new Date() }
          });

          res.json({ success: true });
      } catch (error) {
          console.error("Erreur mark as read:", error);
          res.status(500).json({ error: "Erreur serveur" });
      }
  },

  async closeConversation(req: Request, res: Response) {
      try {
          const userId = req.user?.userId;
          const { conversationId } = req.params;

          await prisma.conversationMember.update({
              where: {
                  userId_conversationId: { userId: userId!, conversationId }
              },
              data: { closed: true }
          });

          res.json({ success: true });
      } catch (error) {
          console.error("Erreur close conversation:", error);
          res.status(500).json({ error: "Impossible de fermer la conversation" });
      }
  }
};