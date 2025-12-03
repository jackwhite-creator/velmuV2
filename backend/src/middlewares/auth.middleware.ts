import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthenticationError } from './error.middleware';
import logger from '../lib/logger';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    logger.warn('Auth attempt without token', { path: req.path });
    return next(new AuthenticationError('Token manquant'));
  }

  const [scheme, token] = authHeader.split(' ');

  if (!token || (scheme !== 'Bearer' && scheme !== 'Bot')) {
    return next(new AuthenticationError('Format de token invalide (Bearer ou Bot attendu)'));
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