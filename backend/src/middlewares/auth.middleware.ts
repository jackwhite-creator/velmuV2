import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthenticationError } from './error.middleware';
import logger from '../lib/logger';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    logger.warn('Auth attempt without token', { path: req.path });
    return next(new AuthenticationError('Token manquant'));
  }

  jwt.verify(token, config.jwtSecret, (err: any, decoded: any) => {
    if (err) {
      logger.warn('Invalid token attempt', { error: err.message, path: req.path });
      return next(new AuthenticationError('Token invalide ou expiré'));
    }
    
    req.user = decoded;
    next();
  });
};