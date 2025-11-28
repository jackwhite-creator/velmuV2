import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/conversation.service';
import { messageService } from '../services/message.service';

export const getUserConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const conversations = await conversationService.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { targetUserId } = req.body;
    const conversation = await conversationService.createOrGetConversation(userId, targetUserId);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;
    const conversation = await conversationService.getConversation(conversationId, userId);
    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;
    const { limit, cursor } = req.query;
    
    const messages = await messageService.getConversationMessages(
      conversationId,
      userId,
      limit ? parseInt(limit as string) : undefined,
      cursor as string
    );
    
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;
    const { content, replyToId, attachments } = req.body;

    const message = await messageService.createConversationMessage(conversationId, userId, {
      content,
      replyToId,
      attachments
    });

    const io = req.app.get('io');
    if (io) {
      // Emit to the conversation room (for those currently viewing it)
      io.to(`conversation_${conversationId}`).emit('new_message', message);
      
      // Fetch conversation to get participants
      const conversation = await conversationService.getConversation(conversationId, userId);
      
      // Emit to each user's private room (for notifications/list update)
      conversation.members.forEach(member => {
          io.to(`user_${member.userId}`).emit('conversation_bump', { id: conversationId });
      });
    }

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;
    await conversationService.markAsRead(conversationId, userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const closeConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;
    await conversationService.closeConversation(conversationId, userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};