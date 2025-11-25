import { Socket } from 'socket.io';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

export interface AuthenticatedSocket extends Socket {
  userId: string;
}