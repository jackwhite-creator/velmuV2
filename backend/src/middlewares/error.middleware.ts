import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from '../lib/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(public details: any) {
    super(400, 'Erreur de validation');
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Non authentifié') {
    super(401, message);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Accès refusé') {
    super(403, message);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource introuvable') {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log l'erreur
  logger.error(`Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    stack: err.stack
  });

  // Erreur opérationnelle (expected)
  if (err instanceof AppError) {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json({
        error: err.message,
        details: err.details
      });
    }
    
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  // Erreur Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        error: "Cette ressource existe déjà",
        field: prismaError.meta?.target
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        error: "Ressource introuvable"
      });
    }
  }

  // Erreur inattendue
  logger.error('Unexpected error:', err);
  return res.status(500).json({
    error: "Une erreur interne est survenue"
  });
};
