import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../../../domain/errors/AuthenticationError';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError | AuthenticationError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error details for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  // Determine the status code
  let statusCode = 500;
  if (err instanceof AuthenticationError) {
    statusCode = err.statusCode;
  } else if (err.statusCode) {
    statusCode = err.statusCode;
  } else if (err.message.includes('not found')) {
    statusCode = 404;
  } else if (err.message.includes('already exists')) {
    statusCode = 409;
  } else if (err.message.includes('Invalid') || err.message.includes('Unauthorized')) {
    statusCode = 401;
  }

  // Send the error response
  res.status(statusCode).json({
    error: {
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};