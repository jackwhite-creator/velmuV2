import { Request, Response, NextFunction } from 'express';
import { memberRepository, channelRepository } from '../repositories';
import { AuthenticationError, AuthorizationError } from './error.middleware';
import { Permissions } from '../shared/permissions';

/**
 * Middleware factory to check for specific permissions on a server.
 * Supports deducing serverId from channelId if necessary.
 */
export const requireServerPermission = (permission: Permissions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AuthenticationError('Non authentifié');

      // 1. Try to get serverId from params or body
      let serverId = req.params.serverId || req.body.serverId;

      // 2. If channelId is present (params or body), deduce serverId
      const channelId = req.params.channelId || req.body.channelId || req.query.channelId;
      
      if (!serverId && channelId) {
          const channel = await channelRepository.findById(channelId as string);
          if (channel) serverId = channel.serverId;
      }

      if (!serverId) {
          // If no server context (DMs), skip check
          return next(); 
      }

      const hasPerm = await memberRepository.hasPermission(userId, serverId, permission);

      if (!hasPerm) {
        throw new AuthorizationError(`Permission manquante: ${permission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper to check permission inside a controller
 */
export const checkPermission = async (userId: string, serverId: string, permission: string): Promise<boolean> => {
    return memberRepository.hasPermission(userId, serverId, permission);
};

/**
 * Helper to check if actor has higher role than target
 */
export const checkRoleHierarchy = async (actorId: string, targetId: string, serverId: string): Promise<boolean> => {
    // Owner bypass (Always returns true if actor is owner)
    const server = await memberRepository.prisma.server.findUnique({ where: { id: serverId }, select: { ownerId: true } });
    
    // If actor is owner, they have infinite power (return true)
    if (server?.ownerId === actorId) return true;
    
    // If target is owner, no one can touch them (return false)
    if (server?.ownerId === targetId) return false;

    const actorMember = await memberRepository.findByUserAndServer(actorId, serverId, true);
    const targetMember = await memberRepository.findByUserAndServer(targetId, serverId, true);

    if (!actorMember || !targetMember) return false;

    // Get highest role position for each
    const getHighestPosition = (roles: any[]) => {
        if (!roles || roles.length === 0) return 0; // @everyone is 0
        return Math.max(...roles.map(r => r.position));
    };

    const actorHighest = getHighestPosition(actorMember.roles || []);
    const targetHighest = getHighestPosition(targetMember.roles || []);

    return actorHighest > targetHighest;
};
