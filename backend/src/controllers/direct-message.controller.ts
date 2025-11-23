import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { SocketGuard } from '../services/socket.guard';

export const getDirectMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const cursor = req.query.cursor as string | undefined;

    // Sécurité
    const canAccess = await SocketGuard.validateConversationAccess(req.user!.userId, conversationId);
    if (!canAccess) return res.status(403).json({ error: "Accès refusé" });

    const messages = await ChatService.getConversationMessages(conversationId, cursor);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createDirectMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { conversationId } = req.params;
    const { content, replyToId } = req.body;
    const file = req.file;

    if (!file && (!content || !content.trim())) return res.status(400).json({ error: "Message vide" });

    const canPost = await SocketGuard.validateConversationAccess(userId, conversationId);
    if (!canPost) return res.status(403).json({ error: "Accès refusé" });

    const fileData = file ? {
        url: file.path, 
        filename: file.originalname,
        type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE',
        size: file.size
    } : null;

    const message = await ChatService.createMessage({
        userId, content, fileData, conversationId, replyToId
    });

    const io = req.app.get('io');
    const room = `conversation_${conversationId}`;
    io.to(room).emit('message_created', message);
    // Petit bonus : Update la liste des convs pour remonter celle-ci en haut
    io.to(room).emit('conversation_updated', { id: conversationId, lastMessageAt: new Date() });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};