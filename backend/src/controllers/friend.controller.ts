import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const FriendController = {
  // 1. Envoyer une demande
  async sendRequest(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      let { username, discriminator, usernameString } = req.body;

      if (usernameString && !username) {
          const parts = usernameString.split('#');
          if (parts.length === 2) {
              username = parts[0];
              discriminator = parts[1];
          }
      }

      if (!userId) return res.status(401).json({ error: "Non autorisé" });
      if (!username || !discriminator) return res.status(400).json({ error: "Format invalide" });

      const receiver = await prisma.user.findUnique({
        where: { username_discriminator: { username, discriminator } }
      });

      if (!receiver) return res.status(404).json({ error: "Utilisateur introuvable" });
      if (receiver.id === userId) return res.status(400).json({ error: "Vous ne pouvez pas vous ajouter vous-même" });

      const existingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: receiver.id },
            { senderId: receiver.id, receiverId: userId }
          ]
        }
      });

      if (existingRequest) {
        if (existingRequest.status === 'ACCEPTED') return res.status(400).json({ error: "Déjà amis !" });
        if (existingRequest.senderId === userId) return res.status(400).json({ error: "Demande déjà envoyée." });
        
        // Auto-Accept
        if (existingRequest.senderId === receiver.id) {
           const updatedRequest = await prisma.friendRequest.update({
             where: { id: existingRequest.id },
             data: { status: 'ACCEPTED' },
             include: { sender: true, receiver: true }
           });
           const io = req.app.get('io');
           io.to(userId).emit('friend_request_accepted', updatedRequest);
           io.to(receiver.id).emit('friend_request_accepted', updatedRequest);
           return res.json(updatedRequest);
        }
      }

      const request = await prisma.friendRequest.create({
        data: { senderId: userId, receiverId: receiver.id, status: 'PENDING' },
        include: { sender: true, receiver: true }
      });

      const io = req.app.get('io');
      io.to(receiver.id).emit('new_friend_request', request);
      
      res.status(201).json(request);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 2. Répondre
  async respond(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { requestId, action } = req.body;

      const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
      if (!request) return res.status(404).json({ error: "Introuvable" });
      if (request.receiverId !== userId) return res.status(403).json({ error: "Non autorisé" });

      const io = req.app.get('io');

      if (action === 'ACCEPT') {
        const updated = await prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
          include: { sender: true, receiver: true }
        });
        io.to(request.senderId).emit('friend_request_accepted', updated);
        io.to(request.receiverId).emit('friend_request_accepted', updated); // Important pour le self-update
        res.json(updated);
      } else {
        await prisma.friendRequest.delete({ where: { id: requestId } });
        io.to(request.senderId).emit('friend_removed', requestId);
        res.json({ success: true });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur réponse" });
    }
  },

  // 3. Lister
  async getAll(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const requests = await prisma.friendRequest.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        include: { sender: true, receiver: true }
      });
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Erreur chargement" });
    }
  },

  // 4. Supprimer (VERSION FINALE)
  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { requestId } = req.params;

      const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });

      if (!request) return res.status(404).json({ error: "Relation introuvable" });

      if (request.senderId !== userId && request.receiverId !== userId) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      await prisma.friendRequest.delete({ where: { id: requestId } });

      // Notification Socket Temps Réel aux DEUX parties
      const io = req.app.get('io');
      
      // On prévient l'autre (qu'il soit sender ou receiver)
      const otherUserId = request.senderId === userId ? request.receiverId : request.senderId;
      io.to(otherUserId).emit('friend_removed', requestId);
      
      // On prévient aussi l'émetteur (soi-même) pour être sûr que tous les clients (si multi-fenêtres) sont à jour
      io.to(userId).emit('friend_removed', requestId);

      res.json({ success: true });
    } catch (error) {
      console.error("Erreur delete:", error);
      res.status(500).json({ error: "Erreur suppression" });
    }
  }
};