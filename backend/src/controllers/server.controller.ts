import { Request, Response, NextFunction } from 'express';
import { serverService } from '../services/server.service';

export const getUserServers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const servers = await serverService.getUserServers(userId);
    res.json(servers);
  } catch (error) {
    next(error);
  }
};

export const getServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;
    const server = await serverService.getServer(serverId, userId);
    res.json(server);
  } catch (error) {
    next(error);
  }
};

export const createServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;
    const file = req.file;

    let iconUrl = null;
    if (file) {
      iconUrl = (file as any).path || (file as any).secure_url;
    }

    const server = await serverService.createServer(userId, name, iconUrl);
    
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('server_created', server);
    }

    res.status(201).json(server);
  } catch (error) {
    next(error);
  }
};

export const updateServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { name, systemChannelId } = req.body;
    const userId = req.user!.userId;
    const file = req.file;

    let updateData: any = {};
    if (name) updateData.name = name;
    if (systemChannelId !== undefined) {
      updateData.systemChannelId = systemChannelId === '' ? null : systemChannelId;
    }
    if (file) {
      updateData.iconUrl = (file as any).path || (file as any).secure_url;
    }

    const updatedServer = await serverService.updateServer(serverId, userId, updateData);

    const io = req.app.get('io');
    if (io) {
      io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);
    }

    res.json(updatedServer);
  } catch (error) {
    next(error);
  }
};

export const deleteServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;
    const result = await serverService.deleteServer(serverId, userId);
    res.json(result);
  } catch (error) {
   next(error);
  }
};

export const leaveServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;
    const result = await serverService.leaveServer(serverId, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getServerInvites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.userId;
    const invites = await serverService.getServerInvites(serverId, userId);
    res.json(invites);
  } catch (error) {
    next(error);
  }
};

export const deleteServerInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId, inviteId } = req.params;
    const userId = req.user!.userId;
    const result = await serverService.deleteServerInvite(serverId, inviteId, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};