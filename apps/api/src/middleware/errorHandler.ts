import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/index.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 1. Zod schema validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
    return;
  }

  // 2. Malformed JSON payload from express.json()
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    res.status(400).json({
      code: 'BAD_REQUEST',
      message: 'Malformed JSON payload.',
    });
    return;
  }

  // 3. CORS origin policy rejection
  if (err.message?.includes('not permitted by CORS policy')) {
    res.status(403).json({
      code: 'CORS_FORBIDDEN',
      message: 'Origin not permitted by CORS policy.',
    });
    return;
  }

  // 4. General application & internal server errors
  const statusCode = err.status || err.statusCode || 500;
  const is5xx = statusCode >= 500;

  res.status(statusCode).json({
    code: err.code || (is5xx ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
    message: config.isProduction && is5xx
      ? 'An internal server error occurred.'
      : err.message || 'An unexpected error occurred.',
    ...(!config.isProduction ? { stack: err.stack } : {}),
  });
}
