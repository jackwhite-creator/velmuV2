import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const requesterId = (req as any).user?.userId;
    const user = await userService.getUserById(userId, requesterId);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    let updateData = { ...req.body };

    // Handle avatar upload
    if (files && files['avatar'] && files['avatar'][0]) {
      const avatarFile = files['avatar'][0];
      updateData.avatarUrl = (avatarFile as any).path || (avatarFile as any).secure_url;
    }

    // Handle banner upload
    if (files && files['banner'] && files['banner'][0]) {
      const bannerFile = files['banner'][0];
      updateData.bannerUrl = (bannerFile as any).path || (bannerFile as any).secure_url;
    }

    // Nettoyer les champs undefined/null qui ne devraient pas être mis à jour
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === 'undefined') {
            delete updateData[key];
        }
    });

    const user = await userService.updateUser(userId, updateData);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await userService.getUserProfile(userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
};