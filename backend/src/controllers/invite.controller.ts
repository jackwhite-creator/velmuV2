import { Request, Response, NextFunction } from 'express';
import { inviteService } from '../services/invite.service';

export const createInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    // serverId is in body because route is /api/invites/create
    const { serverId, maxUses, expiresIn } = req.body;
    
    const invite = await inviteService.createInvite(serverId, userId, { maxUses, expiresIn });
    res.status(201).json(invite);
  } catch (error) {
    next(error);
  }
};

export const getInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const invite = await inviteService.getInviteByCode(code);
    res.json(invite);
  } catch (error) {
    next(error);
  }
};

export const joinServerWithInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const userId = req.user!.userId;
    
    const { server, member } = await inviteService.joinServer(code, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`server_${server.id}`).emit('refresh_server_ui', server.id);
      io.to(`server_${server.id}`).emit('member_added', member);
    }

    res.json(server);
  } catch (error) {
    next(error);
  }
};