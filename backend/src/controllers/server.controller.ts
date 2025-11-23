import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ChannelType } from '@prisma/client';

export const getUserServers = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const members = await prisma.member.findMany({
      where: { userId },
      include: { server: true }
    });
    const servers = members.map(m => m.server);
    res.json(servers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur récupération serveurs" });
  }
};

export const getServer = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;

    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } }
    });

    if (!member) return res.status(403).json({ error: "Accès refusé" });

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            channels: { orderBy: { order: 'asc' } }
          }
        },
        channels: {
           where: { categoryId: null },
           orderBy: { order: 'asc' }
        },
        roles: { orderBy: { position: 'desc' } },
        members: { include: { user: true, roles: true } }
      }
    });

    res.json(server);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createServer = async (req: Request, res: Response) => {
  try {
    const { name, iconUrl } = req.body;
    const userId = req.user!.userId;

    if (!name) return res.status(400).json({ error: "Le nom est requis" });

    const server = await prisma.$transaction(async (tx) => {
      
      const newServer = await tx.server.create({
        data: { name, iconUrl, ownerId: userId }
      });

      const adminRole = await tx.role.create({
        data: {
          name: "Admin",
          color: "#E91E63",
          permissions: ["ADMINISTRATOR"],
          serverId: newServer.id,
          position: 999
        }
      });

      await tx.member.create({
        data: {
          userId,
          serverId: newServer.id,
          roleIds: [adminRole.id]
        }
      });

      const category = await tx.category.create({
        data: {
          name: "Salons textuels",
          serverId: newServer.id,
          order: 0
        }
      });

      await tx.channel.create({
        data: {
          name: "général",
          type: ChannelType.TEXT,
          serverId: newServer.id,
          categoryId: category.id,
          order: 0
        }
      });

      return newServer;
    });

    const fullServer = await prisma.server.findUnique({
        where: { id: server.id },
        include: { 
            channels: { orderBy: { order: 'asc' } }, 
            categories: { 
                orderBy: { order: 'asc' },
                include: { channels: { orderBy: { order: 'asc' } } } 
            },
            members: { 
               include: { user: true, roles: true } 
            },
            roles: true
        }
    });

    res.status(201).json(fullServer);

  } catch (error) {
    console.error("Erreur création serveur:", error);
    res.status(500).json({ error: "Impossible de créer le serveur" });
  }
};

export const updateServer = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;
    const { name, iconUrl } = req.body;
    const userId = req.user!.userId;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) return res.status(404).json({ error: "Serveur introuvable" });

    if (server.ownerId !== userId) {
      return res.status(403).json({ error: "Seul le propriétaire peut modifier ce serveur" });
    }

    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: { 
        name, 
        iconUrl 
      }
    });

    const io = req.app.get('io');
    io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);

    res.json(updatedServer);

  } catch (error) {
    console.error("Erreur update serveur:", error);
    res.status(500).json({ error: "Impossible de mettre à jour le serveur" });
  }
};

export const deleteServer = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) return res.status(404).json({ error: "Serveur introuvable" });
    if (server.ownerId !== userId) return res.status(403).json({ error: "Non autorisé" });

    await prisma.server.delete({ where: { id: serverId } });

    res.json({ message: "Serveur supprimé" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur suppression serveur" });
  }
};

export const leaveServer = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) return res.status(404).json({ error: "Serveur introuvable" });

    if (server.ownerId === userId) {
      return res.status(400).json({ error: "Le propriétaire ne peut pas quitter le serveur. Vous devez le supprimer." });
    }

    try {
        await prisma.member.delete({
            where: {
                userId_serverId: {
                    userId: userId,
                    serverId: serverId
                }
            }
        });
    } catch (e) {
        return res.status(400).json({ error: "Vous n'êtes pas membre de ce serveur" });
    }

    const io = req.app.get('io');
    io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);

    res.json({ message: "Serveur quitté avec succès" });

  } catch (error) {
    console.error("Erreur leave server:", error);
    res.status(500).json({ error: "Erreur lors du départ du serveur" });
  }
};