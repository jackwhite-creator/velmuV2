import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ChatService } from '../services/chat.service';

// UPDATE MESSAGE
export const updateMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { messageId } = req.params;
    const { content } = req.body;

    // 1. Vérifier propriété
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message introuvable" });
    if (message.userId !== userId) return res.status(403).json({ error: "Non autorisé" });

    // 2. Update
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: {
        user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
        attachments: true,
        replyTo: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } }
      }
    });

    // 3. Socket Notify
    const io = req.app.get('io');
    // Astuce : On notifie la room correspondante (Channel ou DM)
    const room = updatedMessage.channelId || `conversation_${updatedMessage.conversationId}`;
    io.to(room).emit('message_updated', updatedMessage);

    res.json(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// DELETE MESSAGE
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { messageId } = req.params;

    // 1. Vérifier propriété
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message introuvable" });
    if (message.userId !== userId) return res.status(403).json({ error: "Non autorisé" });

    // 2. Delete
    await prisma.message.delete({ where: { id: messageId } });

    // 3. Socket Notify
    const io = req.app.get('io');
    const room = message.channelId || `conversation_${message.conversationId}`;
    io.to(room).emit('message_deleted', { 
        id: messageId, 
        channelId: message.channelId, 
        conversationId: message.conversationId 
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


export const createMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    // Multer met les champs texte dans req.body et le fichier dans req.file
    const { content, channelId, conversationId, replyToId } = req.body;
    const file = req.file;

    // Validation
    if (!content && !file) {
        return res.status(400).json({ error: "Le message ne peut pas être vide" });
    }
    
    // Préparation des métadonnées du fichier si présent
    let fileData = null;
    if (file) {
        // L'URL d'accès public (statique)
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        
        // Détection basique du type pour le frontend
        const type = file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE';
        
        fileData = {
            url: fileUrl,
            filename: file.originalname,
            type: type,
            size: file.size
        };
    }

    // Appel au service
    const newMessage = await ChatService.createMessage({
        userId,
        content: content || '', // Peut être vide si c'est juste une image
        fileData,
        channelId,
        conversationId,
        replyToId
    });

    // Émission Socket
    const io = req.app.get('io');
    const room = channelId || `conversation_${conversationId}`;
    io.to(room).emit('new_message', newMessage);

    return res.status(201).json(newMessage);

  } catch (error) {
    console.error("Create Message Error:", error);
    return res.status(500).json({ error: "Erreur lors de l'envoi du message" });
  }
};

// ✅ AJOUT : GET MESSAGES (Pagination)
export const getMessages = async (req: Request, res: Response) => {
    try {
        const { channelId, conversationId, cursor } = req.query;
        
        if (!channelId && !conversationId) {
            return res.status(400).json({ error: "ID manquant" });
        }

        let messages;
        const limit = 20; // Charge 20 messages par scroll

        if (channelId) {
            messages = await ChatService.getChannelMessages(
                channelId as string, 
                cursor as string | undefined,
                limit
            );
        } else {
            messages = await ChatService.getConversationMessages(
                conversationId as string,
                cursor as string | undefined,
                limit
            );
        }

        // Logique de "nextCursor" pour le scroll infini frontend
        let nextCursor = null;
        if (messages.length === limit) {
            nextCursor = messages[messages.length - 1].id;
        }

        return res.json({ 
            items: messages, 
            nextCursor 
        });

    } catch (error) {
        console.error("Get Messages Error:", error);
        return res.status(500).json({ error: "Impossible de récupérer les messages" });
    }
};