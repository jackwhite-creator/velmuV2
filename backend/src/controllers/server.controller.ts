import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ChannelType } from '@prisma/client';
import { AppError, NotFoundError, AuthorizationError } from '../middlewares/error.middleware';

export const getUserServers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const members = await prisma.member.findMany({
      where: { userId },
      include: { server: true }
    });
    const servers = members.map(m => m.server);
    res.json(servers);
  } catch (error) {
    next(error);
  }
};

export const getServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;

    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } }
    });

    if (!member) throw new AuthorizationError("Accès refusé");

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

    if (!server) throw new NotFoundError("Serveur introuvable");

    res.json(server);
  } catch (error) {
    next(error);
  }
};

export const createServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;
    const file = req.file;

    if (!name) throw new AppError(400, "Le nom est requis");

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
            channels: { orderBy:  { order: 'asc' } }, 
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
    next(error);
  }
};

export const updateServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { name } = req.body;
    const userId = req.user!.userId;
    const file = req.file;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new NotFoundError("Serveur introuvable");

    if (server.ownerId !== userId) {
      throw new AuthorizationError("Seul le propriétaire peut modifier ce serveur");
    }

    let updateData: any = { name };
    if (req.body.systemChannelId !== undefined) {
        updateData.systemChannelId = req.body.systemChannelId;
    }
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
    next(error);
  }
};

export const deleteServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new NotFoundError("Serveur introuvable");
    if (server.ownerId !== userId) throw new AuthorizationError("Non autorisé");

    await prisma.server.delete({ where: { id: serverId } });

    res.json({ message: "Serveur supprimé" });
  } catch (error) {
    next(error);
  }
};

export const leaveServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new NotFoundError("Serveur introuvable");

    if (server.ownerId === userId) {
      throw new AppError(400, "Le propriétaire ne peut pas quitter le serveur. Vous devez le supprimer.");
    }

    try {
        await prisma.member.delete({
            where: { userId_serverId: { userId, serverId } }
        });
    } catch (e) {
        throw new AppError(400, "Vous n'êtes pas membre de ce serveur");
    }

    const io = req.app.get('io');
    io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);

    res.json({ message: "Serveur quitté avec succès" });

  } catch (error) {
    next(error);
  }
};

export const getServerInvites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;

    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
      include: { roles: true }
    });

    if (!member) throw new AuthorizationError("Accès refusé");

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
    next(error);
  }
};

export const deleteServerInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId, inviteId } = req.params;
    const userId = req.user!.userId;

    // 1. Vérif droits (Propriétaire ou Admin)
    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
      include: { server: true, roles: true }
    });

    if (!member) throw new AuthorizationError("Accès refusé");

    // Pour simplifier : Seul l'owner ou les admins peuvent supprimer
    // (On considère ici que si tu as accès aux paramètres, tu peux supprimer)
    // Idéalement, vérifier la permission "MANAGE_SERVER"

    // 2. Vérif que l'invitation appartient bien à ce serveur
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.serverId !== serverId) {
        throw new NotFoundError("Invitation introuvable");
    }

    // 3. Suppression
    await prisma.invite.delete({ where: { id: inviteId } });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};