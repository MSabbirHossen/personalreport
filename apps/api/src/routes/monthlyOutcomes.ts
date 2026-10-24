import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import {
  DEFAULT_METRIC_GROUPS,
  calculateMonthlyAggregates,
  SaveMonthlyOutcomeInputSchema,
  SubmitMonthlyOutcomeInputSchema,
} from '@reportbd/shared';

export const monthlyOutcomesRouter = Router();

// Helper to get days in month
function getDaysInMonth(yearMonth: string): number {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  return new Date(year, month, 0).getDate();
}

// GET /api/v1/monthly-outcomes/:month
monthlyOutcomesRouter.get('/:month', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = req.params.month as string;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ code: 'INVALID_MONTH', message: 'Month format must be YYYY-MM' });
      return;
    }

    const user = req.user!;
    const db = await getDb();

    // 1. Fetch daily reports for this month
    const regex = new RegExp(`^${month}-\\d{2}$`);
    const dailyDocs = await db
      .collection('dailyReports')
      .find({
        orgId: user.orgId!,
        studentId: user.userId,
        dateKey: { $regex: regex },
      })
      .toArray();

    const dailyValuesByDate: Record<string, any> = {};
    for (const d of dailyDocs) {
      dailyValuesByDate[d.dateKey] = d.values;
    }

    // 2. Calculate derived aggregates using all default metrics
    const allMetrics = DEFAULT_METRIC_GROUPS.flatMap((g) => g.metrics);
    const calendarDays = getDaysInMonth(month);
    const derivedValues = calculateMonthlyAggregates(allMetrics, dailyValuesByDate, calendarDays);

    // 3. Fetch Monthly Plan for comparison
    const plan = await db.collection('monthlyPlans').findOne({
      orgId: user.orgId!,
      studentId: user.userId,
      monthKey: month,
    });

    // 4. Fetch Monthly Outcome record (manual values, reflections, status)
    const outcome = await db.collection('monthlyOutcomes').findOne({
      orgId: user.orgId!,
      studentId: user.userId,
      monthKey: month,
    });

    res.json({
      monthKey: month,
      derivedValues,
      manualValues: outcome?.manualValues || {},
      reflections: outcome?.reflections || {},
      status: outcome?.status || 'draft',
      targets: plan?.targets || {},
      isPlanShared: plan?.status === 'shared' || plan?.status === 'acknowledged',
      submittedAt: outcome?.submittedAt,
      reviewedAt: outcome?.reviewedAt,
      reviewedBy: outcome?.reviewedBy,
      revision: outcome?.revision || 0,
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// PUT /api/v1/monthly-outcomes/:month
monthlyOutcomesRouter.put('/:month', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = req.params.month as string;
    const body = SaveMonthlyOutcomeInputSchema.parse({ ...req.body, monthKey: month });
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.collection('monthlyOutcomes').findOne({
      orgId: user.orgId!,
      studentId: user.userId,
      monthKey: month,
    });

    const nextRevision = existing ? (existing.revision || 1) + 1 : 1;

    const outcomeDoc = {
      orgId: user.orgId!,
      studentId: user.userId,
      monthKey: month,
      manualValues: body.manualValues,
      reflections: body.reflections,
      status: existing?.status || 'draft',
      revision: nextRevision,
      updatedAt: now,
    };

    await db.collection('monthlyOutcomes').updateOne(
      { orgId: user.orgId!, studentId: user.userId, monthKey: month },
      {
        $set: outcomeDoc,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    res.json({ success: true, outcome: outcomeDoc });
  } catch (err: any) {
    res.status(400).json({ code: 'SAVE_FAILED', message: err.message });
  }
});

// POST /api/v1/monthly-outcomes/:month/submit
monthlyOutcomesRouter.post('/:month/submit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = req.params.month as string;
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    // 1. Fetch daily values to freeze snapshot
    const regex = new RegExp(`^${month}-\\d{2}$`);
    const dailyDocs = await db
      .collection('dailyReports')
      .find({
        orgId: user.orgId!,
        studentId: user.userId,
        dateKey: { $regex: regex },
      })
      .toArray();

    const dailyValuesByDate: Record<string, any> = {};
    for (const d of dailyDocs) {
      dailyValuesByDate[d.dateKey] = d.values;
    }

    const allMetrics = DEFAULT_METRIC_GROUPS.flatMap((g) => g.metrics);
    const calendarDays = getDaysInMonth(month);
    const derivedValues = calculateMonthlyAggregates(allMetrics, dailyValuesByDate, calendarDays);

    const snapshot = {
      calculatedAt: now,
      templateVersionId: 'default_v1',
      derivedValues,
      dailyReportsCount: dailyDocs.length,
    };

    await db.collection('monthlyOutcomes').updateOne(
      { orgId: user.orgId!, studentId: user.userId, monthKey: month },
      {
        $set: {
          derivedValues,
          snapshot,
          status: 'submitted',
          submittedAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    res.json({ success: true, message: 'Monthly report submitted for supervisor review.' });
  } catch (err: any) {
    res.status(400).json({ code: 'SUBMISSION_FAILED', message: err.message });
  }
});
