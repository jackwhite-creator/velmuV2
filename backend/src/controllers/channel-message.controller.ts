import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { SocketGuard } from '../services/socket.guard';

export const getChannelMessages = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const cursor = req.query.cursor as string | undefined;
    
    // 1. Check Sécurité (Optionnel ici si on considère que lire l'historique 
    // nécessite les mêmes droits que rejoindre le socket. Pour la perf on peut skipper, 
    // mais c'est mieux de vérifier).
    const canAccess = await SocketGuard.validateChannelAccess(req.user!.userId, channelId);
    if (!canAccess) return res.status(403).json({ error: "Accès refusé" });

    const messages = await ChatService.getChannelMessages(channelId, cursor);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createChannelMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { channelId } = req.params;
    const { content, replyToId } = req.body;
    const file = req.file;

    // 1. Validation : Message vide ?
    if (!file && (!content || !content.trim())) {
      return res.status(400).json({ error: "Message vide" });
    }

    // 2. Sécurité : Est-ce qu'il est membre du serveur ?
    const canPost = await SocketGuard.validateChannelAccess(userId, channelId);
    if (!canPost) return res.status(403).json({ error: "Accès refusé" });

    // 3. Prépa fichier
    const fileData = file ? {
        url: file.path, 
        filename: file.originalname,
        type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE',
        size: file.size
    } : null;

    // 4. Création
    const message = await ChatService.createMessage({
        userId, content, fileData, channelId, replyToId
    });

    // 5. Socket Notify
    const io = req.app.get('io');
    io.to(channelId).emit('message_created', message);

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};