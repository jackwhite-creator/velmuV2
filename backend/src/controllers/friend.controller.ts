import { Request, Response, NextFunction } from 'express';
import { friendService } from '../services/friend.service';
import { RequestStatus } from '@prisma/client';
import { onlineUsers } from '../socket';

export const getFriendRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const requests = await friendService.getFriendRequests(userId);
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const sendFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { username, discriminator } = req.body;

    if (!username || !discriminator) {
      res.status(400).json({ error: 'Username and discriminator are required' });
      return;
    }

    const request = await friendService.sendFriendRequest(userId, username, discriminator);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${request.receiverId}`).emit('new_friend_request', request);
    }

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

export const updateFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    // Support both RESTful params and body (for /respond route)
    const requestId = req.params.requestId || req.body.requestId;
    
    // Support both status (direct) and action (legacy/frontend)
    let { status, action } = req.body;
    
    if (action === 'ACCEPT') status = 'ACCEPTED';
    if (action === 'DECLINE' || action === 'REJECT') status = 'REJECTED'; 

    if (!requestId || !status) {
        res.status(400).json({ error: "RequestId and status (or action) are required" });
        return;
    }

    const request = await friendService.updateFriendRequest(requestId, userId, status as RequestStatus);

    const io = req.app.get('io');
    if (io && status === 'ACCEPTED') {
      io.to(`user_${request.senderId}`).emit('friend_request_accepted', request);
      io.to(`user_${request.receiverId}`).emit('friend_request_accepted', request);

      // <--- Sync Online Status
      const isSenderOnline = onlineUsers.has(request.senderId);
      const isReceiverOnline = onlineUsers.has(request.receiverId);

      if (isSenderOnline) {
          io.to(`user_${request.receiverId}`).emit('user_status_change', { userId: request.senderId, status: 'online' });
      }
      if (isReceiverOnline) {
          io.to(`user_${request.senderId}`).emit('user_status_change', { userId: request.receiverId, status: 'online' });
      }
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const removeFriend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const userId = req.user!.userId;
    const request = await friendService.removeFriend(requestId, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${request.senderId}`).emit('friend_removed', requestId);
      io.to(`user_${request.receiverId}`).emit('friend_removed', requestId);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};