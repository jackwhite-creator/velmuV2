import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const InviteController = {
  // 1. Créer une invitation
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { serverId } = req.body;

      const member = await prisma.member.findUnique({
        where: { userId_serverId: { userId: userId!, serverId } }
      });

      if (!member) return res.status(403).json({ error: "Non autorisé" });

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const invite = await prisma.invite.create({
        data: {
          code,
          serverId,
          creatorId: userId!,
          maxUses: 0,
          expiresAt: null
        }
      });

      res.status(201).json(invite);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur création invitation" });
    }
  },

  // 2. Rejoindre via une invitation
  async join(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { code } = req.params;

      // A. Trouver l'invitation
      const invite = await prisma.invite.findUnique({
        where: { code },
        include: { server: true }
      });

      if (!invite) return res.status(404).json({ error: "Invitation invalide" });

      // B. Vérifications
      if (invite.expiresAt && new Date() > invite.expiresAt) {
        return res.status(410).json({ error: "Invitation expirée" });
      }
      if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
        return res.status(410).json({ error: "Invitation invalide (max usages)" });
      }

      // C. Vérifier si déjà membre
      const existingMember = await prisma.member.findUnique({
        where: { userId_serverId: { userId: userId!, serverId: invite.serverId } }
      });

      if (existingMember) {
        return res.json({ serverId: invite.serverId });
      }

      // D. Rôle par défaut (Optionnel : assure-toi qu'un rôle 'Membre' existe ou gère le null)
      // Note : Dans createServer, on ne crée pas forcément de rôle "Membre" par défaut, 
      // donc on sécurise ici au cas où guestRole est null.
      const guestRole = await prisma.role.findFirst({
        where: { 
            serverId: invite.serverId,
            name: "Membre" 
        }
      });

      // E. Transaction
      await prisma.$transaction(async (tx) => {
        // 1. Incrémenter l'usage
        await tx.invite.update({
            where: { id: invite.id },
            data: { uses: { increment: 1 } }
        });

        // 2. Créer le membre
        await tx.member.create({
            data: {
                userId: userId!,
                serverId: invite.serverId,
                roles: guestRole ? {
                    connect: { id: guestRole.id }
                } : undefined
            }
        });
      });

      // F. Notification Socket
      const io = req.app.get('io');
      
      // ✅ CORRECTION ICI : On utilise le même événement que ServerController et ChannelController
      // Cela force ChatPage.tsx à recharger les données du serveur (dont la liste des membres)
      io.to(`server_${invite.serverId}`).emit('refresh_server_ui', invite.serverId);
      
      res.json({ serverId: invite.serverId });

    } catch (error) {
      console.error("Erreur JOIN INVITE:", error);
      res.status(500).json({ error: "Impossible de rejoindre le serveur" });
    }
  },

  // 3. Obtenir les infos
  async getInfo(req: Request, res: Response) {
      try {
          const { code } = req.params;
          const invite = await prisma.invite.findUnique({
              where: { code },
              include: { 
                  server: { select: { name: true, iconUrl: true, id: true } },
                  creator: { select: { username: true } }
              }
          });
          
          if (!invite) return res.status(404).json({ error: "Introuvable" });
          
          res.json({
              code: invite.code,
              server: invite.server,
              inviter: invite.creator?.username,
              memberCount: await prisma.member.count({ where: { serverId: invite.serverId } })
          });

      } catch (error) {
          res.status(500).json({ error: "Erreur" });
      }
  }
};