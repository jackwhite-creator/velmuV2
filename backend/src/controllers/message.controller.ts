import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ChatService } from '../services/chat.service';
import { AIService } from '../services/ai.service';

const AI_BOT_ID = 'cl-velmu-ai-bot-0001';
const AI_BOT_NAME = 'Velmu AI';
const AI_MENTION = `@${AI_BOT_NAME}`;

export const createMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { content, channelId, conversationId, replyToId } = req.body;
    const file = req.file;

    if (!content && !file) {
        return res.status(400).json({ error: "Le message ne peut pas être vide" });
    }
    
    let fileData = null;
    if (file) {
        const fileUrl = (file as any).path; 
        const type = file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE';
        
        fileData = {
            url: fileUrl,
            filename: file.originalname,
            type: type,
            size: file.size
        };
    }

    const newMessage = await ChatService.createMessage({
        userId,
        content: content || '',
        fileData,
        channelId,
        conversationId,
        replyToId
    });

    const io = req.app.get('io');
    const room = channelId || `conversation_${conversationId}`;
    
    if (conversationId) {
      const now = new Date();
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now },
        include: { members: { include: { user: true } } }
      });

      await prisma.conversationMember.update({
        where: { userId_conversationId: { userId, conversationId } },
        data: { lastReadAt: now, closed: false }
      });

      await prisma.conversationMember.updateMany({
        where: { conversationId, userId: { not: userId } },
        data: { closed: false }
      });

      const formattedConv = {
          ...conversation,
          users: conversation.members.map(m => m.user),
          unreadCount: 1 
      };
      
      conversation.members.forEach(member => {
          if (member.userId !== userId) {
              io.to(member.userId).emit('conversation_bump', formattedConv);
          }
      });
    }

    // Étape 1 : On envoie toujours le message de l'utilisateur à tout le monde
    io.to(room).emit('new_message', newMessage);

    // Étape 2 : APRÈS, on vérifie si c'est une mention pour l'IA
    if (content && content.trim().startsWith(AI_MENTION)) {
      const userQuestion = content.trim().substring(AI_MENTION.length).trim();

      if (userQuestion) {
        // On lance le traitement IA en arrière-plan (sans await)
        (async () => {
          const typingPayload = { 
            userId: AI_BOT_ID, 
            username: AI_BOT_NAME, 
            isTyping: true,
            channelId,
            conversationId
          };
          io.to(room).emit('user_typing', typingPayload);

          const aiResponse = await AIService.getChatCompletion(userQuestion);

          typingPayload.isTyping = false;
          io.to(room).emit('user_typing', typingPayload);
          
          const aiMessage = await ChatService.createMessage({
            userId: AI_BOT_ID,
            content: aiResponse,
            fileData: null,
            channelId,
            conversationId,
            replyToId: newMessage.id // L'IA répond directement au message de l'utilisateur
          });

          io.to(room).emit('new_message', aiMessage);
        })();
      }
    }

    return res.status(201).json(newMessage);

  } catch (error) {
    console.error("Create Message Error:", error);
    return res.status(500).json({ error: "Erreur lors de l'envoi du message" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { channelId, conversationId, cursor } = req.query;
        if (!channelId && !conversationId) {
            return res.status(400).json({ error: "ID manquant" });
        }
        let messages;
        const limit = 20;
        if (channelId) {
            messages = await ChatService.getChannelMessages(channelId as string, cursor as string | undefined, limit);
        } else {
            messages = await ChatService.getConversationMessages(conversationId as string, cursor as string | undefined, limit);
        }
        let nextCursor = null;
        if (messages.length === limit) {
            nextCursor = messages[messages.length - 1].id;
        }
        return res.json({ items: messages, nextCursor });
    } catch (error) {
        console.error("Get Messages Error:", error);
        return res.status(500).json({ error: "Impossible de récupérer les messages" });
    }
};

export const updateMessage = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { messageId } = req.params;
        const { content } = req.body;
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ error: "Message introuvable" });
        if (message.userId !== userId) return res.status(403).json({ error: "Non autorisé" });
        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: { content },
            include: {
                user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
                attachments: true,
                replyTo: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } }
            }
        });
        const io = req.app.get('io');
        const room = updatedMessage.channelId || `conversation_${updatedMessage.conversationId}`;
        io.to(room).emit('message_updated', updatedMessage);
        res.json(updatedMessage);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};

export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { messageId } = req.params;
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ error: "Message introuvable" });
        if (message.userId !== userId) return res.status(403).json({ error: "Non autorisé" });
        await prisma.message.delete({ where: { id: messageId } });
        const io = req.app.get('io');
        const room = message.channelId || `conversation_${message.conversationId}`;
        io.to(room).emit('message_deleted', { 
            id: messageId, 
            channelId: message.channelId, 
            conversationId: message.conversationId 
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};