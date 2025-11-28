import { Request, Response, NextFunction } from 'express';
import { channelService } from '../services/channel.service';

export const createChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    // serverId is in body because route is /api/channels/
    const { serverId, name, type, categoryId } = req.body;

    const channel = await channelService.createChannel(serverId, userId, { name, type, categoryId });

    const io = req.app.get('io');
    if (io) {
      io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);
    }

    res.status(201).json(channel);
  } catch (error) {
    next(error);
  }
};

export const updateChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.userId;
    const { name, categoryId, order } = req.body;

    const channel = await channelService.updateChannel(channelId, userId, { name, categoryId, order });

    const io = req.app.get('io');
    if (io && channel.serverId) {
      io.to(`server_${channel.serverId}`).emit('refresh_server_ui', channel.serverId);
    }

    res.json(channel);
  } catch (error) {
    next(error);
  }
};

export const deleteChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.userId;
    const result = await channelService.deleteChannel(channelId, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const reorderChannels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { updates } = req.body;
    const result = await channelService.reorderChannels(userId, updates);
    
    const io = req.app.get('io');
    if (io && result.serverId) {
        io.to(`server_${result.serverId}`).emit('refresh_server_ui', result.serverId);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};