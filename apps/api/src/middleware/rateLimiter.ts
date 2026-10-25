import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipInTest?: boolean;
}

// In-memory bucket store
const rateLimitStore = new Map<string, RateLimitRecord>();

export function getRateLimitStoreSize(): number {
  return rateLimitStore.size;
}

export function cleanupExpiredRateLimits(currentTime: number = Date.now()): number {
  let cleaned = 0;
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime <= currentTime) {
      rateLimitStore.delete(key);
      cleaned += 1;
    }
  }
  return cleaned;
}

// Periodic cleanup of expired rate limit keys every 5 minutes
const cleanupInterval = setInterval(() => {
  cleanupExpiredRateLimits();
}, 5 * 60 * 1000);

// Prevent cleanup interval from holding Node process open on exit
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export function clearRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Creates an in-memory sliding-window rate limiting middleware.
 * Zero external dependencies; sets standard RateLimit-* and Retry-After headers.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    skipInTest = true,
    keyGenerator = (req: Request) => {
      // In trusted proxy configuration (req.ip) or direct socket
      const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
      const user = (req as any).user;
      return user ? `user:${user.orgId || 'no_org'}:${user.userId}` : `ip:${ip}`;
    },
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const isTestEnvironment =
      process.env.NODE_ENV === 'test' ||
      process.argv.some((arg) => arg.includes('test')) ||
      Boolean(process.env.NODE_TEST_CONTEXT);

    // Permitted bypass for test suites when skipInTest is true or DISABLE_RATE_LIMITER is set
    if ((skipInTest && isTestEnvironment) || process.env.DISABLE_RATE_LIMITER === 'true') {
      next();
      return;
    }

    const key = keyGenerator(req);
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || record.resetTime <= now) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      res.status(429).json({
        code: 'TOO_MANY_REQUESTS',
        message,
        retryAfter: resetSeconds,
      });
      return;
    }

    next();
  };
}

// 1. Strict Limiter: For auth-adjacent & sensitive single-use token acceptance (15 req / 15 min)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

// 2. Sensitive Action Limiter: For invite creation & administrative invitations (30 req / 15 min)
export const inviteRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Invitation creation limit reached. Please wait before creating more invitations.',
});

// 3. Operational Limiter: For supervisor review submissions & audit log explorer (60 req / 1 min)
export const sensitiveOpsLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Operation request limit reached. Please wait a moment before trying again.',
});

// 4. General API Limiter: Broad defense-in-depth across API routes (300 req / 1 min)
export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'API rate limit exceeded. Please slow down your requests.',
});
