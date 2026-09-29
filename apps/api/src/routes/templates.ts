import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { DEFAULT_METRIC_GROUPS } from '@reportbd/shared';

export const templatesRouter = Router();

// GET /api/v1/templates/current
templatesRouter.get('/current', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In V1 pilot, return the standardized default template version
    res.json({
      template: {
        id: 'default_v1',
        version: 1,
        name: 'মানসম্মত রিপোর্ট ফরম্যাট (Standard)',
        groups: DEFAULT_METRIC_GROUPS,
        isDefault: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});
