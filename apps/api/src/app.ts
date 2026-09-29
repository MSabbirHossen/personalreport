import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

import { meRouter } from './routes/me.js';
import { dailyReportsRouter } from './routes/dailyReports.js';
import { monthlyPlansRouter } from './routes/monthlyPlans.js';
import { monthlyOutcomesRouter } from './routes/monthlyOutcomes.js';
import { adviceRouter } from './routes/advice.js';
import { templatesRouter } from './routes/templates.js';
import { supervisorRouter } from './routes/supervisor.js';
import { organizationRouter } from './routes/organization.js';

export const app = express();

// Global Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'reportbd-api', timestamp: new Date().toISOString() });
});

// API v1 Routes
const v1 = express.Router();

v1.use('/templates', requireAuth, templatesRouter);
v1.use('/me', requireAuth, meRouter);
v1.use('/daily-reports', requireAuth, dailyReportsRouter);
v1.use('/monthly-plans', requireAuth, monthlyPlansRouter);
v1.use('/monthly-outcomes', requireAuth, monthlyOutcomesRouter);
v1.use('/advice', requireAuth, adviceRouter);
v1.use('/supervisor', requireAuth, supervisorRouter);
v1.use('/organization', requireAuth, organizationRouter);

app.use('/api/v1', v1);

// Error handling
app.use(errorHandler);
