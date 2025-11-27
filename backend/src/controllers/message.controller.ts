import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ChatService } from '../services/chat.service';
import { AppError, NotFoundError, AuthorizationError } from '../middlewares/error.middleware';

export const createMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { content, channelId, conversationId, replyToId } = req.body;
    const file = req.file;

    if (!content && !file) {
        throw new AppError(400, "Le message ne peut pas être vide");
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

    io.to(room).emit('new_message', newMessage);
    return res.status(201).json(newMessage);

  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { channelId, conversationId, cursor } = req.query;
        if (!channelId && !conversationId) {
            throw new AppError(400, "ID manquant");
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
        next(error);
    }
};

export const updateMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { messageId } = req.params;
        const { content } = req.body;
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) throw new NotFoundError("Message introuvable");
        if (message.userId !== userId) throw new AuthorizationError("Non autorisé");
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
        next(error);
    }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { messageId } = req.params;
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) throw new NotFoundError("Message introuvable");
        if (message.userId !== userId) throw new AuthorizationError("Non autorisé");
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
        next(error);
    }
};