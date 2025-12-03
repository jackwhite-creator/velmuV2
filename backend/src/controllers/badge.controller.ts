import { Request, Response, NextFunction } from 'express';
import { badgeRepository, userRepository } from '../repositories';

export const getAllBadges = async (req: Request, res: Response, next: NextFunction) => {
// ... (unchanged)
};

export const getUserBadges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const [userBadges, user] = await Promise.all([
        badgeRepository.findUserBadges(userId),
        userRepository.findById(userId)
    ]);

    const result = userBadges.map(ub => ({
        ...ub.badge,
        assignedAt: ub.assignedAt
    }));

    // Virtual badge removed in favor of DB badge
    /*
    if (user && user.isBot) {
        result.unshift({
            id: 'bot-badge',
            name: 'BOT',
            description: 'Application certifiée',
            iconUrl: null, // Or a specific bot icon if available
            createdAt: user.createdAt,
            assignedAt: user.createdAt
        } as any);
    }
    */

    res.json(result);
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
