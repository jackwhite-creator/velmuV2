import { Request, Response } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';

export const getToken = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.query;
    const user = (req as any).user; // Assumes auth middleware populates this

    if (!channelId) {
      return res.status(400).json({ error: 'Missing channelId' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Verify Channel Exists & Get Server ID
    const channel = await prisma.channel.findUnique({
        where: { id: String(channelId) },
        select: { serverId: true }
    });

    if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
    }

    // 2. Verify User is Member of Server
    const member = await prisma.member.findFirst({
        where: {
            userId: user.userId,
            serverId: channel.serverId
        }
    });

    if (!member) {
        return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const roomName = `channel_${channelId}`;
    const participantName = user.username;
    const participantIdentity = user.userId;

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY || 'devkey',
      process.env.LIVEKIT_API_SECRET || 'secret',
      {
        identity: participantIdentity,
        name: participantName,
      }
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    });

    const token = await at.toJwt();

    res.json({ token });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
