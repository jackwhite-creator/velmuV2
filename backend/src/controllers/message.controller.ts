import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service';

export const getChannelMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { channelId, conversationId, limit, cursor } = req.query;

    if (!channelId && !conversationId) {
      res.status(400).json({ error: 'channelId or conversationId is required' });
      return;
    }

    let messages;
    if (channelId) {
      messages = await messageService.getChannelMessages(
        channelId as string,
        userId,
        limit ? parseInt(limit as string) : undefined,
        cursor as string
      );
    } else {
      messages = await messageService.getConversationMessages(
        conversationId as string,
        userId,
        limit ? parseInt(limit as string) : undefined,
        cursor as string
      );
    }

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendChannelMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { channelId, conversationId, content, replyToId, attachments } = req.body;

    if (!channelId && !conversationId) {
      res.status(400).json({ error: 'channelId or conversationId is required' });
      return;
    }

    let message;
    if (channelId) {
      message = await messageService.createChannelMessage(channelId, userId, {
        content,
        replyToId,
        attachments
      });
      
      const io = req.app.get('io');
      if (io) {
        io.to(`channel_${channelId}`).emit('new_message', message);
      }
    } else {
      message = await messageService.createConversationMessage(conversationId, userId, {
        content,
        replyToId,
        attachments
      });

      const io = req.app.get('io');
      if (io) {
        // Emit to conversation room (for active chat)
        io.to(`conversation_${conversationId}`).emit('new_message', message);

        // Emit to each user's personal room (for notifications/sidebar updates)
        try {
            // Dynamic import to avoid circular dependency if any, though service import is fine
            const { conversationService } = await import('../services/conversation.service');
            const conversation = await conversationService.getConversation(conversationId, userId);
            
            if (conversation && conversation.users) {
                conversation.users.forEach((u: any) => {
                    io.to(`user_${u.id}`).emit('new_message', { ...message, conversationId });
                });
            }
        } catch (err) {
            console.error('Error emitting DM notification:', err);
        }
      }
    }

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

export const updateMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.userId;
    const { content } = req.body;

    const message = await messageService.updateMessage(messageId, userId, content);

    const io = req.app.get('io');
    if (io) {
      const roomId = message.channelId ? `channel_${message.channelId}` : `conversation_${message.conversationId}`;
      io.to(roomId).emit('message_updated', message);
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.userId;

    const message = await messageService.deleteMessage(messageId, userId);

    const io = req.app.get('io');
    if (io) {
      const roomId = message.channelId ? `channel_${message.channelId}` : `conversation_${message.conversationId}`;
      io.to(roomId).emit('message_deleted', { 
        id: messageId,
        channelId: message.channelId,
        conversationId: message.conversationId
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
export const getMessages = getChannelMessages;
export const createMessage = sendChannelMessage;