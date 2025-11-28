import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const file = req.file;
    
    let updateData = { ...req.body };
    if (file) {
      const field = req.body.field || 'avatarUrl';
      updateData[field] = (file as any).path || (file as any).secure_url;
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