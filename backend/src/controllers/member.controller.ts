import { Request, Response, NextFunction } from 'express';
import { memberService } from '../services/member.service';

export const getServerMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;
    const members = await memberService.getServerMembers(serverId, userId);
    res.json(members);
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId, memberId } = req.params;
    const userId = req.user!.userId;
    const { nickname, roleIds } = req.body;

    const member = await memberService.updateMember(serverId, memberId, userId, { nickname, roleIds });
    
    const io = req.app.get('io');
    if (io) {
      io.to(`server_${serverId}`).emit('member_updated', member);
    }

    res.json(member);
  } catch (error) {
    next(error);
  }
};

export const kickMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId, memberId } = req.params;
    const userId = req.user!.userId;

    await memberService.kickMember(serverId, memberId, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`server_${serverId}`).emit('member_removed', { memberId });
      io.to(`user_${memberId}`).emit('kicked_from_server', { serverId });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};