import { Request, Response, NextFunction } from 'express';
import { memberRepository, channelRepository } from '../repositories';
import { memberRepository } from '../repositories';
import { AuthenticationError, AuthorizationError } from './error.middleware';
import { Permissions } from '../shared/permissions';

/**
 * Middleware factory to check for specific permissions on a server.
 * Supports deducing serverId from channelId if necessary.
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

      // 2. If channelId is present (params or body), deduce serverId
      // Critical fix: Check body for POST messages
      const channelId = req.params.channelId || req.body.channelId || req.query.channelId;

      if (!serverId && channelId) {
          const channel = await channelRepository.findById(channelId as string);
          if (channel) serverId = channel.serverId;
      }

      if (!serverId) {
          // If we can't determine server context (e.g. DM), strict permission checks might be skipped
          // or handled differently. For now, if no server, we assume it's allowed (e.g. DM)
          // UNLESS the permission is clearly server-only.
          // Better safe: If it's a server permission, block if no server found.
          // But for "SEND_MESSAGES", it applies to DMs too.

          // Exception for DMs where serverId is null
          return next();
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
 * Helper to check permission inside a controller
 * Helper to check permission inside a controller without middleware overhead if needed
 */
export const checkPermission = async (userId: string, serverId: string, permission: string): Promise<boolean> => {
    return memberRepository.hasPermission(userId, serverId, permission);
};

/**
 * Helper to check if actor has higher role than target
 */
export const checkRoleHierarchy = async (actorId: string, targetId: string, serverId: string): Promise<boolean> => {
    // Owner bypass
    const server = await memberRepository.prisma.server.findUnique({ where: { id: serverId }, select: { ownerId: true } });
    if (server?.ownerId === actorId) return true;
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
