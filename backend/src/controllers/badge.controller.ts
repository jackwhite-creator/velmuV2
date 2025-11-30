import { Request, Response, NextFunction } from 'express';
import { badgeRepository } from '../repositories';

export const getAllBadges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const badges = await badgeRepository.findAll();
    res.json(badges);
  } catch (error) {
    next(error);
  }
};

export const getUserBadges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const userBadges = await badgeRepository.findUserBadges(userId);
    res.json(userBadges.map(ub => ({
        ...ub.badge,
        assignedAt: ub.assignedAt
    })));
  } catch (error) {
    next(error);
  }
};

export const assignBadge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, badgeId } = req.body;
    
    // TODO: Add admin check here if not already handled by middleware
    
    const userBadge = await badgeRepository.assignToUser(userId, badgeId);
    res.status(201).json(userBadge);
  } catch (error) {
    next(error);
  }
};

export const removeBadge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, badgeId } = req.body;
      
      await badgeRepository.removeFromUser(userId, badgeId);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
