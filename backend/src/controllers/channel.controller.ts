import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ChannelType } from '@prisma/client';

export const ChannelController = {
  
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { name, type, categoryId } = req.body;

      if (!categoryId || !name) return res.status(400).json({ error: "Données manquantes" });

      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) return res.status(404).json({ error: "Catégorie introuvable" });

      const member = await prisma.member.findUnique({
        where: {
            userId_serverId: {
                userId: userId!,
                serverId: category.serverId
            }
        },
        include: { roles: true, server: true }
      });

      if (!member) return res.status(403).json({ error: "Accès refusé" });

      const isOwner = member.server.ownerId === userId;
      
      const hasPermission = member.roles.some(r => 
        r.permissions.includes('ADMIN') || r.permissions.includes('MANAGE_CHANNELS')
      );

      if (!isOwner && !hasPermission) {
        return res.status(403).json({ error: "Vous n'avez pas la permission de créer des salons." });
      }

      let prismaType: ChannelType = ChannelType.TEXT;
      if (type === 'audio' || type === 'AUDIO') prismaType = ChannelType.AUDIO;
      if (type === 'video' || type === 'VIDEO') prismaType = ChannelType.VIDEO;

      const channel = await prisma.channel.create({
        data: {
          name,
          type: prismaType,
          categoryId,
          serverId: category.serverId
        }
      });

      const io = req.app.get('io');
      io.to(`server_${category.serverId}`).emit('refresh_server_ui', category.serverId);

      res.status(201).json(channel);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur création salon" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { channelId } = req.params;

      const channel = await prisma.channel.findUnique({ 
          where: { id: channelId },
          include: { server: true }
      });

      if (!channel) return res.status(404).json({ error: "Salon introuvable" });

      const member = await prisma.member.findUnique({
        where: { userId_serverId: { userId: userId!, serverId: channel.serverId } },
        include: { roles: true }
      });

      const isOwner = channel.server.ownerId === userId;
      const hasPermission = member?.roles.some(r => r.permissions.includes('ADMIN') || r.permissions.includes('MANAGE_CHANNELS'));

      if (!isOwner && !hasPermission) return res.status(403).json({ error: "Non autorisé" });

      await prisma.channel.delete({ where: { id: channelId } });

      const io = req.app.get('io');
      io.to(`server_${channel.serverId}`).emit('refresh_server_ui', channel.serverId);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erreur suppression" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { channelId } = req.params;
      const { name } = req.body;

      const channel = await prisma.channel.findUnique({ where: { id: channelId } });
      if (!channel) return res.status(404).json({ error: "Introuvable" });

      const updated = await prisma.channel.update({
        where: { id: channelId },
        data: { name }
      });

      const io = req.app.get('io');
      io.to(`server_${channel.serverId}`).emit('refresh_server_ui', channel.serverId);

      res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Erreur update" });
    }
  },

  async reorder(req: Request, res: Response) {
      try {
          const { categoryId, orderedIds } = req.body; 
          
          if (!categoryId || !orderedIds || !Array.isArray(orderedIds)) {
              return res.status(400).json({ error: "Données invalides" });
          }

          await prisma.$transaction(
            orderedIds.map((id: string, index: number) => 
                prisma.channel.update({
                    where: { id },
                    data: { 
                        order: index,
                        categoryId: categoryId 
                    }
                })
            )
          );

          const category = await prisma.category.findUnique({
              where: { id: categoryId },
              select: { serverId: true }
          });

          if (category) {
              const io = req.app.get('io');
              io.to(`server_${category.serverId}`).emit('refresh_server_ui', category.serverId);
          }
          
          res.json({ success: true });
      } catch (error) {
          console.error("Erreur Reorder:", error);
          res.status(500).json({ error: "Erreur réorganisation" });
      }
  }
};