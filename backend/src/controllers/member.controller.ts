import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const MemberController = {
  async getByServerId(req: Request, res: Response) {
    try {
      const { serverId } = req.params;
      
      const members = await prisma.member.findMany({
        where: { serverId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              avatarUrl: true,
            }
          },
          roles: true
        },
        orderBy: { joinedAt: 'asc' } 
      });

      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Erreur chargement membres" });
    }
  },

  async kick(req: Request, res: Response) {
    try {
      const requesterId = req.user?.userId;
      const { serverId, memberId } = req.params; 

      const server = await prisma.server.findUnique({ where: { id: serverId } });
      if (!server) return res.status(404).json({ error: "Serveur introuvable" });

      if (server.ownerId !== requesterId) {
        return res.status(403).json({ error: "Permission refusée" });
      }

      if (memberId === requesterId) {
        return res.status(400).json({ error: "Impossible de s'auto-exclure" });
      }

      const memberToDelete = await prisma.member.findFirst({
        where: {
          userId: memberId,
          serverId: serverId
        }
      });

      if (!memberToDelete) {
        return res.status(404).json({ error: "Ce membre n'est pas dans le serveur" });
      }

      await prisma.member.delete({
        where: { id: memberToDelete.id }
      });

      const io = req.app.get('io');
      io.to(`server_${serverId}`).emit('refresh_members');
      io.emit('member_kicked', { serverId, userId: memberId });

      res.json({ success: true });
    } catch (error) {
      console.error("Erreur Kick:", error);
      res.status(500).json({ error: "Erreur interne" });
    }
  }
};