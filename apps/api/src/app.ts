import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateStartupConfig } from './config/index.js';
import { isDatabaseHealthy } from './db/mongo.js';
import { requireAuth, requireActiveMembership } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

import { meRouter } from './routes/me.js';
import { dailyReportsRouter } from './routes/dailyReports.js';
import { monthlyPlansRouter } from './routes/monthlyPlans.js';
import { monthlyOutcomesRouter } from './routes/monthlyOutcomes.js';
import { adviceRouter } from './routes/advice.js';
import { templatesRouter } from './routes/templates.js';
import { supervisorRouter } from './routes/supervisor.js';
import { organizationRouter } from './routes/organization.js';
import { invitationsRouter } from './routes/invitations.js';
import { notificationsRouter } from './routes/notifications.js';

import { generalApiLimiter } from './middleware/rateLimiter.js';

export const app = express();

// Configure trust proxy setting for reverse proxies (Nginx, AWS ALB, Cloudflare)
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

// Validate critical security configuration at startup
const configValidation = validateStartupConfig();
if (!configValidation.valid) {
  console.error('❌ Configuration validation failed:', configValidation.errors);
  if (config.isProduction) {
    throw new Error(`Production configuration invalid: ${configValidation.errors.join('; ')}`);
  }
}

// Global Security Middlewares
const helmetMiddleware: any = (helmet as any).default || helmet;
app.use(
  helmetMiddleware({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

// Strict CORS Policy
const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    // Non-browser or server-to-server requests (no Origin header)
    if (!requestOrigin) {
      return callback(null, true);
    }

    if (config.isProduction) {
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);
      // In production, reject wildcards and match allowed origins (or localhost if explicitly enabled)
      if (
        config.cors.allowedOrigins.includes(requestOrigin) ||
        (isLocalhost && (process.env.ALLOW_LOCALHOST_CORS === 'true' || config.cors.allowedOrigins.some(o => o.includes('localhost') || o.includes('127.0.0.1'))))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${requestOrigin} not permitted by CORS policy.`));
    }

    // In local development, permit configured origins or localhost/127.0.0.1
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);
    if (config.cors.isWildcardAllowed || isLocalhost || config.cors.allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${requestOrigin} not permitted by CORS policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Root & Liveness check (API process up) - supports '/', '/health', and '/api/health'
app.get(['/', '/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'bps-report-api',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Readiness check (Distinguishes process availability from database connectivity)
app.get(['/health/ready', '/api/health/ready'], async (_req, res) => {
  const dbHealthy = await isDatabaseHealthy();
  if (dbHealthy) {
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// API v1 Routes
const v1 = express.Router();

// General API Rate Limiting across all v1 routes
v1.use(generalApiLimiter);

// Self / Profile routes: authenticated users without membership can still access their own profile
v1.use('/me', requireAuth, meRouter);

// Invitations (preview & accept)
v1.use('/invitations', invitationsRouter);

// Organization-scoped routes: strictly require BOTH identity and active membership
v1.use('/templates', requireAuth, requireActiveMembership, templatesRouter);
v1.use('/daily-reports', requireAuth, requireActiveMembership, dailyReportsRouter);
v1.use('/monthly-plans', requireAuth, requireActiveMembership, monthlyPlansRouter);
v1.use('/monthly-outcomes', requireAuth, requireActiveMembership, monthlyOutcomesRouter);
v1.use('/advice', requireAuth, requireActiveMembership, adviceRouter);
v1.use('/supervisor', requireAuth, requireActiveMembership, supervisorRouter);
v1.use('/organization', requireAuth, requireActiveMembership, organizationRouter);
v1.use('/notifications', requireAuth, requireActiveMembership, notificationsRouter);

app.use('/api/v1', v1);

// Error handling middleware
app.use(errorHandler);

export default app;

