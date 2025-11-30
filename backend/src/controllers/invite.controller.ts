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
    
    let onlineCount = 0;
    const io = req.app.get('io');
    if (io && invite?.server) {
        const room = io.sockets.adapter.rooms.get(`server_${invite.server.id}`);
        if (room) {
            onlineCount = room.size;
        }
    }

    res.json({ ...invite, onlineCount });
  } catch (error) {
    next(error);
  }
};

export const joinServerWithInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const userId = req.user!.userId;
    
    const { server, member, welcomeMessage } = await inviteService.joinServer(code, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`server_${server.id}`).emit('refresh_server_ui', server.id);
      io.to(`server_${server.id}`).emit('member_added', member);

      if (welcomeMessage) {
        io.to(`channel_${welcomeMessage.channelId}`).emit('new_message', welcomeMessage);
      }
    }

    res.json(server);
  } catch (error) {
    next(error);
  }
};