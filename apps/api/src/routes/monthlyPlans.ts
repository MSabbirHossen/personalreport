import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import { SaveMonthlyPlanInputSchema } from '@reportbd/shared';

export const monthlyPlansRouter = Router();

// GET /api/v1/monthly-plans/:month
monthlyPlansRouter.get('/:month', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = req.params.month as string;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ code: 'INVALID_MONTH', message: 'Month format must be YYYY-MM' });
      return;
    }

    const user = req.user!;
    const db = await getDb();

    const plan = await db.collection('monthlyPlans').findOne({
      orgId: user.orgId,
      studentId: user.userId,
      monthKey: month,
    });

    if (!plan) {
      res.json({
        monthKey: month,
        targets: {},
        status: 'draft',
        revision: 0,
      });
      return;
    }

    res.json({
      monthKey: plan.monthKey,
      targets: plan.targets,
      notes: plan.notes,
      status: plan.status,
      revision: plan.revision,
      sharedAt: plan.sharedAt,
      acknowledgedAt: plan.acknowledgedAt,
      updatedAt: plan.updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// PUT /api/v1/monthly-plans/:month
monthlyPlansRouter.put('/:month', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = req.params.month as string;
    const body = SaveMonthlyPlanInputSchema.parse({ ...req.body, monthKey: month });
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.collection('monthlyPlans').findOne({
      orgId: user.orgId,
      studentId: user.userId,
      monthKey: month,
    });

    const nextRevision = existing ? (existing.revision || 1) + 1 : 1;

    const planDoc = {
      orgId: user.orgId,
      studentId: user.userId,
      monthKey: month,
      targets: body.targets,
      notes: body.notes,
      status: existing?.status || 'draft',
      revision: nextRevision,
      updatedAt: now,
    };

    await db.collection('monthlyPlans').updateOne(
      { orgId: user.orgId, studentId: user.userId, monthKey: month },
      {
        $set: planDoc,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    res.json({ success: true, plan: planDoc });
  } catch (err: any) {
    res.status(400).json({ code: 'SAVE_FAILED', message: err.message });
  }
});

// POST /api/v1/monthly-plans/:month/share
monthlyPlansRouter.post('/:month/share', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = req.params.month as string;
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    const result = await db.collection('monthlyPlans').updateOne(
      { orgId: user.orgId, studentId: user.userId, monthKey: month },
      {
        $set: {
          status: 'shared',
          sharedAt: now,
          updatedAt: now,
        },
      }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Monthly plan draft not found' });
      return;
    }

    res.json({ success: true, message: 'Plan shared with supervisor' });
  } catch (err: any) {
    res.status(400).json({ code: 'SHARE_FAILED', message: err.message });
  }
});
