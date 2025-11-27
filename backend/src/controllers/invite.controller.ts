import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const InviteController = {
  async getInviteInfo(req: Request, res: Response) {
    try {
      const { code } = req.params;

      const invite = await prisma.invite.findUnique({
        where: { code },
        include: {
          server: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
              _count: { select: { members: true } }
            }
          },
          creator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        }
      });

      if (!invite) return res.status(404).json({ error: "Invitation introuvable" });

      if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
        return res.status(410).json({ error: "Invitation expirée" });
      }
      
      if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
        return res.status(410).json({ error: "Invitation expirée (Max usages)" });
      }

      res.json({
        code: invite.code,
        server: {
            id: invite.server.id,
            name: invite.server.name,
            iconUrl: invite.server.iconUrl,
            memberCount: invite.server._count.members
        },
        inviter: invite.creator
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { serverId, maxUses = 0, expiresIn = 604800 } = req.body;

      if (!serverId) return res.status(400).json({ error: "Server ID manquant" });

      const member = await prisma.member.findUnique({
        where: { userId_serverId: { userId: userId!, serverId } }
      });

      if (!member) return res.status(403).json({ error: "Non autorisé" });

      let expiresAt = null;
      if (expiresIn > 0) {
        expiresAt = new Date(Date.now() + expiresIn * 1000);
      }

      const code = Math.random().toString(36).substring(2, 8);

      const invite = await prisma.invite.create({
        data: {
          code,
          serverId,
          creatorId: userId!,
          maxUses: parseInt(maxUses),
          expiresAt
        }
      });

      res.status(201).json(invite);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur création invitation" });
    }
  },

  async join(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { code } = req.params;

      const invite = await prisma.invite.findUnique({
        where: { code },
        include: { server: true }
      });

      if (!invite) return res.status(404).json({ error: "Invitation invalide" });

      if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
        return res.status(410).json({ error: "Invitation expirée" });
      }

      if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
        return res.status(410).json({ error: "Invitation invalide (Max usages atteint)" });
      }

      const existingMember = await prisma.member.findUnique({
        where: { userId_serverId: { userId: userId!, serverId: invite.serverId } }
      });

      if (existingMember) {
        return res.json({ message: "Déjà membre", serverId: invite.serverId });
      }

      await prisma.$transaction([
        prisma.member.create({
          data: { userId: userId!, serverId: invite.serverId }
        }),
        prisma.invite.update({
          where: { id: invite.id },
          data: { uses: { increment: 1 } }
        })
      ]);

      // --- SYSTEM MESSAGE LOGIC ---
      const server = await prisma.server.findUnique({ where: { id: invite.serverId } });
      if (server && server.systemChannelId) {
          try {
             const user = await prisma.user.findUnique({ where: { id: userId! } });
             if (user) {
                 const systemMsg = await prisma.message.create({
                     data: {
                         content: `${user.username}#${user.discriminator} est arrivé !`,
                         type: "SYSTEM",
                         channelId: server.systemChannelId,
                         userId: userId!
                     },
                     include: { user: true }
                 });
                 
                 const io = req.app.get('io');
                 io.to(server.systemChannelId).emit('new_message', systemMsg);
             }
          } catch (e) {
              console.error("Erreur creation message systeme", e);
          }
      }
      // ----------------------------

      res.json({ message: "Serveur rejoint", serverId: invite.serverId });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur lors de la jonction" });
    }
  }
};