import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, { statusCode: err.statusCode });
    ResponseHandler.error(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      ResponseHandler.error(res, `Duplicate entry for ${prismaError.meta?.target?.join(', ')}`, 409);
      return;
    }
    if (prismaError.code === 'P2025') {
      ResponseHandler.notFound(res, 'Record not found');
      return;
    }
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const zodError = err as any;
    const errors = zodError.errors.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    ResponseHandler.badRequest(res, 'Validation failed', errors);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    ResponseHandler.unauthorized(res, 'Invalid token');
    return;
  }
  if (err.name === 'TokenExpiredError') {
    ResponseHandler.unauthorized(res, 'Token expired');
    return;
  }

  logger.error('Unhandled error:', err);
  ResponseHandler.error(res, 'Internal server error', 500);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  ResponseHandler.notFound(res, 'Route not found');
};
