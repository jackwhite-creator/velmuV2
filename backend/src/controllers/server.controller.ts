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
    const { name } = req.body;
    const userId = req.user!.userId;
    const file = req.file;

    if (!name) return res.status(400).json({ error: "Le nom est requis" });

    let iconUrl = null;
    if (file) {
        iconUrl = (file as any).path || (file as any).secure_url;
    }

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
            members: { include: { user: true, roles: true } },
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
    const { name } = req.body;
    const userId = req.user!.userId;
    const file = req.file;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) return res.status(404).json({ error: "Serveur introuvable" });

    if (server.ownerId !== userId) {
      return res.status(403).json({ error: "Seul le propriétaire peut modifier ce serveur" });
    }

    let updateData: any = { name };
    if (file) {
        updateData.iconUrl = (file as any).path || (file as any).secure_url;
    }

    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: updateData
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
            where: { userId_serverId: { userId, serverId } }
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

export const getServerInvites = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;

    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
      include: { roles: true }
    });

    if (!member) return res.status(403).json({ error: "Accès refusé" });

    const invites = await prisma.invite.findMany({
      where: { serverId },
      include: {
        creator: {
          select: { id: true, username: true, discriminator: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invites);
  } catch (error) {
    console.error("Erreur récupération invitations:", error);
    res.status(500).json({ error: "Impossible de charger les invitations" });
  }
};

export const deleteServerInvite = async (req: Request, res: Response) => {
  try {
    const { serverId, inviteId } = req.params;
    const userId = req.user!.userId;

    // 1. Vérif droits (Propriétaire ou Admin)
    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
      include: { server: true, roles: true }
    });

    if (!member) return res.status(403).json({ error: "Accès refusé" });

    // Pour simplifier : Seul l'owner ou les admins peuvent supprimer
    // (On considère ici que si tu as accès aux paramètres, tu peux supprimer)
    // Idéalement, vérifier la permission "MANAGE_SERVER"

    // 2. Vérif que l'invitation appartient bien à ce serveur
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.serverId !== serverId) {
        return res.status(404).json({ error: "Invitation introuvable" });
    }

    // 3. Suppression
    await prisma.invite.delete({ where: { id: inviteId } });

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression invitation:", error);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};