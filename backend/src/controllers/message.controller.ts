import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service';
import { channelRepository } from '../repositories';

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
    const { channelId, conversationId, content, replyToId, attachments, embed } = req.body;

    if (!channelId && !conversationId) {
      res.status(400).json({ error: 'channelId or conversationId is required' });
      return;
    }

    // Handle potential file upload for message
    let finalAttachments = attachments;
    
    // Initialize finalAttachments if it's a string or undefined
    if (typeof finalAttachments === 'string') {
      try {
        finalAttachments = JSON.parse(finalAttachments);
      } catch (e) {
        finalAttachments = [];
      }
    }
    if (!Array.isArray(finalAttachments)) finalAttachments = [];

    // Process uploaded files
    if (req.files && Array.isArray(req.files)) {
      const files = req.files as any[];
      
      files.forEach(file => {
        let fileUrl = file.path;
        
        // Check if it's a remote URL (Cloudinary) or local path
        if (file.path && (file.path.startsWith('http') || file.path.startsWith('https'))) {
            fileUrl = file.path;
        } else {
            // Local upload fallback
            const filename = file.filename;
            fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
        }

        const newAttachment = {
          url: fileUrl,
          filename: file.originalname,
          type: file.mimetype,
          size: file.size
        };
        
        finalAttachments.push(newAttachment);
      });
    } else if (req.file) {
      // Fallback for single file upload (legacy support)
      const file = req.file as any;
      let fileUrl = file.path;
      
      if (file.path && (file.path.startsWith('http') || file.path.startsWith('https'))) {
          fileUrl = file.path;
      } else {
          const filename = file.filename;
          fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      }

      finalAttachments.push({
        url: fileUrl,
        filename: file.originalname,
        type: file.mimetype,
        size: file.size
      });
    }

    let message: any;
    if (channelId) {
      message = await messageService.createChannelMessage(channelId, userId, {
        content,
        embed,
        replyToId,
        attachments: finalAttachments
      });
      
      const io = req.app.get('io');
      if (io) {
        // Emit to bots in the server
        const channel = await channelRepository.findById(channelId);
        if (channel) {
            const payload = { ...message, serverId: channel.serverId };
            io.to(`channel_${channelId}`).emit('new_message', payload);
            io.to(`server_${channel.serverId}_bots`).emit('new_message', payload);
        } else {
            io.to(`channel_${channelId}`).emit('new_message', message);
        }
      }
    } else {
      message = await messageService.createConversationMessage(conversationId, userId, {
        content,
        replyToId,
        attachments: finalAttachments
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
            
            if (conversation && conversation.members) {
                conversation.members.forEach((member: any) => {
                    io.to(`user_${member.userId}`).emit('dm_notification', { ...message, conversationId });
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

export const getMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.userId;
    const message = await messageService.getMessage(messageId, userId);
    res.json(message);
  } catch (error) {
    next(error);
  }
};

export const addReaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user!.userId;

    const { reaction, message } = await messageService.addReaction(messageId, userId, emoji);

    const io = req.app.get('io');
    if (io) {
      const roomId = message.channelId ? `channel_${message.channelId}` : `conversation_${message.conversationId}`;
      const payload = { messageId, reaction };
      io.to(roomId).emit('message_reaction_add', payload);

      // Emit to bots if it's a server message
      if (message.channelId) {
        const channel = await channelRepository.findById(message.channelId);
        if (channel) {
            io.to(`server_${channel.serverId}_bots`).emit('message_reaction_add', payload);
        }
      }
    }

    res.status(201).json(reaction);
  } catch (error) {
    next(error);
  }
};

export const removeReaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.user!.userId;

    const { message } = await messageService.removeReaction(messageId, userId, emoji);

    const io = req.app.get('io');
    if (io) {
      const roomId = message.channelId ? `channel_${message.channelId}` : `conversation_${message.conversationId}`;
      const payload = { messageId, userId, emoji };
      io.to(roomId).emit('message_reaction_remove', payload);

      // Emit to bots if it's a server message
      if (message.channelId) {
        const channel = await channelRepository.findById(message.channelId);
        if (channel) {
            io.to(`server_${channel.serverId}_bots`).emit('message_reaction_remove', payload);
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};