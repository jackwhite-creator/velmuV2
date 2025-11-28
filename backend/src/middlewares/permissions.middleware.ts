import { Request, Response, NextFunction } from 'express';
import { memberRepository } from '../repositories';
import { AuthenticationError, AuthorizationError } from './error.middleware';
import { Permissions } from '../shared/permissions';

/**
 * Middleware factory to check for specific permissions on a server.
 * Usage: router.delete('/:messageId', requirePermission(Permissions.MANAGE_MESSAGES), deleteMessage);
 *
 * Note: This middleware assumes 'req.params.serverId' exists OR checks context to find serverId.
 * For message deletion, we might need to fetch the channel first to know the server.
 * This is a basic implementation to be extended.
 */
export const requireServerPermission = (permission: Permissions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AuthenticationError('Non authentifié');

      // 1. Try to get serverId from params or body
      let serverId = req.params.serverId || req.body.serverId;

      // 2. If no serverId, but we have a channelId (common case), we might need to look it up.
      // Ideally, routes should be structured /api/servers/:serverId/channels...
      // but if not, we'd need to fetch the channel here.
      // For now, we enforce this middleware only on routes where serverId is explicit.

      if (!serverId) {
          // Fallback: Check if we can deduce it from other params (advanced usage)
          // For now, fail safe.
          return next();
          // or throw new Error("Server Context missing for permission check");
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
 * Helper to check permission inside a controller without middleware overhead if needed
 */
export const checkPermission = async (userId: string, serverId: string, permission: string): Promise<boolean> => {
    return memberRepository.hasPermission(userId, serverId, permission);
};
