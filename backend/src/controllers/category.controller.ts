import { Request, Response, NextFunction } from 'express';
import { channelService } from '../services/channel.service';

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    // serverId is in body because route is /api/categories/
    const { serverId, name } = req.body;

    const category = await channelService.createCategory(serverId, userId, name);

    const io = req.app.get('io');
    if (io) {
      io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);
    }

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user!.userId;
    const { name, order } = req.body;

    const category = await channelService.updateCategory(categoryId, userId, { name, order });

    const io = req.app.get('io');
    if (io && category.serverId) {
      io.to(`server_${category.serverId}`).emit('refresh_server_ui', category.serverId);
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user!.userId;
    const result = await channelService.deleteCategory(categoryId, userId);
    
    const io = req.app.get('io');
    if (io && result.serverId) {
        io.to(`server_${result.serverId}`).emit('refresh_server_ui', result.serverId);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const reorderCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { updates } = req.body;
    
    const result = await channelService.reorderCategories(userId, updates);
    
    const io = req.app.get('io');
    if (io && result.serverId) {
        io.to(`server_${result.serverId}`).emit('refresh_server_ui', result.serverId);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};