import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    console.log('🔴 Auth Middleware: Token manquant');
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      console.log('🔴 Auth Middleware: Token invalide', err.message);
      return res.status(403).json({ error: 'Token invalide' });
    }
    
    // On attache l'utilisateur décodé à la requête
    req.user = decoded;
    
     console.log('🟢 Auth Middleware: Succès pour user', decoded.userId); // De-commenter pour debug
    next();
  });
};