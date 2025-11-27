import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from './error.middleware';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((err: z.ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return next(new ValidationError(details));
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((err: z.ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return next(new ValidationError(details));
      }
      next(error);
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((err: z.ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return next(new ValidationError(details));
      }
      next(error);
    }
  };
};
