import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const CategoryController = {
  // 1. CRÉER UNE CATÉGORIE
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { name, serverId } = req.body;

      if (!name || !serverId) {
        return res.status(400).json({ error: "Données manquantes" });
      }

      // Vérification des droits (Propriétaire du serveur)
      const server = await prisma.server.findUnique({
        where: { id: serverId }
      });

      if (!server) return res.status(404).json({ error: "Serveur introuvable" });
      if (server.ownerId !== userId) return res.status(403).json({ error: "Interdit" });

      // Création
      const category = await prisma.category.create({
        data: {
          name,
          serverId,
          order: 999 // Par défaut à la fin
        }
      });

      // Notification Socket
      const io = req.app.get('io');
      io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);

      res.status(201).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur création catégorie" });
    }
  },

  // 2. MODIFIER UNE CATÉGORIE
  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { categoryId } = req.params;
      const { name } = req.body;

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { server: true }
      });

      if (!category) return res.status(404).json({ error: "Catégorie introuvable" });
      if (category.server.ownerId !== userId) return res.status(403).json({ error: "Interdit" });

      const updated = await prisma.category.update({
        where: { id: categoryId },
        data: { name }
      });

      // Notification Socket
      const io = req.app.get('io');
      io.to(`server_${category.server.id}`).emit('refresh_server_ui', category.server.id);

      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur modification catégorie" });
    }
  },

  // 3. SUPPRIMER UNE CATÉGORIE
  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { categoryId } = req.params;

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { server: true }
      });

      if (!category) return res.status(404).json({ error: "Catégorie introuvable" });
      if (category.server.ownerId !== userId) return res.status(403).json({ error: "Interdit" });

      const serverId = category.server.id;

      await prisma.category.delete({
        where: { id: categoryId }
      });

      // Notification Socket
      const io = req.app.get('io');
      io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur suppression catégorie" });
    }
  },

  // 4. RÉORGANISER (Drag & Drop Catégories)
  async reorder(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      // On reçoit : { serverId, orderedIds: ["cat1", "cat2", ...] }
      const { serverId, orderedIds } = req.body;

      const server = await prisma.server.findUnique({ where: { id: serverId } });
      if (!server) return res.status(404).json({ error: "Serveur introuvable" });
      if (server.ownerId !== userId) return res.status(403).json({ error: "Interdit" });

      // Transaction pour mettre à jour l'ordre de chaque catégorie
      const transaction = orderedIds.map((catId: string, index: number) => {
        return prisma.category.update({
          where: { id: catId },
          data: { order: index }
        });
      });

      await prisma.$transaction(transaction);

      // Socket refresh
      const io = req.app.get('io');
      io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur réorganisation" });
    }
  }
};