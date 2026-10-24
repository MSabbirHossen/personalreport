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

export const app = express();

// Validate critical security configuration at startup
const configValidation = validateStartupConfig();
if (!configValidation.valid) {
  console.error('❌ Configuration validation failed:', configValidation.errors);
  if (config.isProduction) {
    throw new Error(`Production configuration invalid: ${configValidation.errors.join('; ')}`);
  }
}

// Global Security Middlewares
app.use(helmet());

// Strict CORS Policy
const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    // Non-browser or server-to-server requests (no Origin header)
    if (!requestOrigin) {
      return callback(null, true);
    }

    if (config.isProduction) {
      // In production, reject wildcards and strictly match allowed origins
      if (config.cors.allowedOrigins.includes(requestOrigin)) {
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

// Liveness check (API process up)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'reportbd-api',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Readiness check (Distinguishes process availability from database connectivity)
app.get('/health/ready', async (_req, res) => {
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

app.use('/api/v1', v1);

// Error handling middleware
app.use(errorHandler);
