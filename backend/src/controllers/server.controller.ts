import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ChannelType, MemberRole } from '@prisma/client';

// GET USER SERVERS
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

// GET SINGLE SERVER
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

// CREATE SERVER (Version Nettoyée : Texte uniquement)
export const createServer = async (req: Request, res: Response) => {
  try {
    const { name, iconUrl } = req.body;
    const userId = req.user!.userId;

    if (!name) return res.status(400).json({ error: "Le nom est requis" });

    const server = await prisma.$transaction(async (tx) => {
      
      // 1. Création du Serveur
      const newServer = await tx.server.create({
        data: { name, iconUrl, ownerId: userId }
      });

      // 2. Rôle Admin
      const adminRole = await tx.role.create({
        data: {
          name: "Admin",
          color: "#E91E63",
          permissions: ["ADMINISTRATOR"],
          serverId: newServer.id,
          position: 999
        }
      });

      // 3. Membre Owner
      await tx.member.create({
        data: {
          userId,
          serverId: newServer.id,
          roleIds: [adminRole.id]
        }
      });

      // 4. Catégorie par défaut
      const category = await tx.category.create({
        data: {
          name: "Salons textuels",
          serverId: newServer.id,
          order: 0
        }
      });

      // 5. Channel par défaut (Uniquement Texte)
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
            // ✅ AJOUT : On inclut les membres et leurs rôles
            members: { 
               include: { user: true, roles: true } 
            },
            roles: true // On inclut aussi les rôles tant qu'à faire
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

    // 1. Vérification : Le serveur existe-t-il ?
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) return res.status(404).json({ error: "Serveur introuvable" });

    // 2. Sécurité : Seul le propriétaire peut modifier
    if (server.ownerId !== userId) {
      return res.status(403).json({ error: "Seul le propriétaire peut modifier ce serveur" });
    }

    // 3. Mise à jour
    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: { 
        name, 
        iconUrl 
      }
    });

    // 4. Notification Socket (Pour que le changement soit visible en direct chez tout le monde)
    const io = req.app.get('io');
    io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);

    res.json(updatedServer);

  } catch (error) {
    console.error("Erreur update serveur:", error);
    res.status(500).json({ error: "Impossible de mettre à jour le serveur" });
  }
};

// DELETE SERVER
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

// ✅ AJOUT : LEAVE SERVER (Quitter un serveur)
export const leaveServer = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;

    // 1. Vérifier si le serveur existe
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) return res.status(404).json({ error: "Serveur introuvable" });

    // 2. Empêcher le propriétaire de quitter (il doit supprimer ou transférer)
    if (server.ownerId === userId) {
      return res.status(400).json({ error: "Le propriétaire ne peut pas quitter le serveur. Vous devez le supprimer." });
    }

    // 3. Supprimer le membre
    // Grâce à la clé unique composée dans le schema.prisma (@@unique([userId, serverId]))
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

    // 4. Notifier (Optionnel mais recommandé pour mettre à jour la liste des membres des autres)
    const io = req.app.get('io');
    // On notifie ceux qui restent que la liste des membres a changé
    io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);

    res.json({ message: "Serveur quitté avec succès" });

  } catch (error) {
    console.error("Erreur leave server:", error);
    res.status(500).json({ error: "Erreur lors du départ du serveur" });
  }
};