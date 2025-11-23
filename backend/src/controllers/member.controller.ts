import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const MemberController = {
  // 1. LISTER LES MEMBRES
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
          }
        },
        orderBy: { role: 'asc' }
      });

      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Erreur chargement membres" });
    }
  },

  // 2. EXCLURE UN MEMBRE
  async kick(req: Request, res: Response) {
    try {
      const requesterId = req.user?.userId;
      // On récupère bien memberId qui correspond maintenant à la route :memberId
      const { serverId, memberId } = req.params; 

      const server = await prisma.server.findUnique({ where: { id: serverId } });
      if (!server) return res.status(404).json({ error: "Serveur introuvable" });

      if (server.ownerId !== requesterId) {
        return res.status(403).json({ error: "Permission refusée" });
      }

      if (memberId === requesterId) {
        return res.status(400).json({ error: "Impossible de s'auto-exclure" });
      }

      // Recherche robuste avec findFirst
      const memberToDelete = await prisma.member.findFirst({
        where: {
          userId: memberId, // memberId est l'ID de l'utilisateur (User.id)
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