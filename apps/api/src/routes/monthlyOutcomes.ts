import { Router, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import {
  DEFAULT_METRIC_GROUPS,
  calculateMonthlyAggregates,
  SaveMonthlyOutcomeInputSchema,
  SubmitMonthlyOutcomeInputSchema,
  PERMISSIONS,
} from '@reportbd/shared';
import { createInAppNotification } from '../services/notifications.js';
import { logAuditEvent } from '../services/audit.js';

export const monthlyOutcomesRouter = Router();

// Helper to get days in month
function getDaysInMonth(yearMonth: string): number {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  return new Date(year, month, 0).getDate();
}

// GET /api/v1/monthly-outcomes/:month
monthlyOutcomesRouter.get('/:month', requirePermission(PERMISSIONS.MONTHLY_OUTCOME_READ_OWN), async (req: AuthenticatedRequest, res: Response) => {
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

    // 2. Calculate current derived aggregates using all default metrics
    const allMetrics = DEFAULT_METRIC_GROUPS.flatMap((g) => g.metrics);
    const calendarDays = getDaysInMonth(month);
    const currentCalculatedValues = calculateMonthlyAggregates(allMetrics, dailyValuesByDate, calendarDays);

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

    // If report is submitted/in_review/acknowledged, the authoritative derivedValues MUST come from the frozen snapshot
    const isSubmittedOrReviewed = outcome && ['submitted', 'in_review', 'acknowledged'].includes(outcome.status);
    const derivedValues = isSubmittedOrReviewed
      ? (outcome.snapshot?.derivedValues || outcome.derivedValues || currentCalculatedValues)
      : currentCalculatedValues;

    res.json({
      monthKey: month,
      derivedValues,
      liveDerivedValues: currentCalculatedValues,
      manualValues: outcome?.manualValues || {},
      reflections: outcome?.reflections || {},
      status: outcome?.status || 'draft',
      targets: plan?.targets || {},
      isPlanShared: plan?.status === 'shared' || plan?.status === 'acknowledged',
      isStale: Boolean(outcome?.isStale),
      staleReason: outcome?.staleReason || null,
      staleAt: outcome?.staleAt || null,
      snapshot: outcome?.snapshot || null,
      submittedAt: outcome?.submittedAt || null,
      reviewedAt: outcome?.reviewedAt || null,
      reviewedBy: outcome?.reviewedBy || null,
      revision: outcome?.revision || 0,
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// PUT /api/v1/monthly-outcomes/:month
monthlyOutcomesRouter.put('/:month', requirePermission(PERMISSIONS.MONTHLY_OUTCOME_WRITE_OWN), async (req: AuthenticatedRequest, res: Response) => {
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

    // Prevent direct edit if submitted or acknowledged (must be returned by supervisor)
    if (existing && ['submitted', 'in_review', 'acknowledged'].includes(existing.status)) {
      res.status(400).json({
        code: 'IMMUTABLE_OUTCOME',
        message: 'Cannot edit outcome in submitted or reviewed state. It must be returned by your supervisor to make changes.',
      });
      return;
    }

    // Optimistic concurrency check
    if (existing && body.revision !== undefined && body.revision !== existing.revision) {
      res.status(409).json({
        code: 'CONFLICT',
        message: 'Monthly outcome was modified on another device. Please reload.',
        serverRevision: existing.revision,
      });
      return;
    }

    const nextRevision = existing ? (existing.revision || 1) + 1 : 1;

    const outcomeDoc = {
      orgId: user.orgId!,
      studentId: user.userId,
      monthKey: month,
      manualValues: (body.manualValues && Object.keys(body.manualValues).length > 0) ? body.manualValues : (existing?.manualValues ?? {}),
      reflections: body.reflections ?? existing?.reflections ?? {},
      status: existing?.status || 'draft',
      revision: nextRevision,
      updatedAt: now,
    };

    if (existing) {
      const updateResult = await db.collection('monthlyOutcomes').updateOne(
        {
          orgId: user.orgId!,
          studentId: user.userId,
          monthKey: month,
          revision: existing.revision,
        },
        {
          $set: outcomeDoc,
        }
      );

      if (updateResult.matchedCount === 0) {
        const latest = await db.collection('monthlyOutcomes').findOne({
          orgId: user.orgId!,
          studentId: user.userId,
          monthKey: month,
        });
        res.status(409).json({
          code: 'CONFLICT',
          message: 'Concurrent update conflict detected for monthly outcome.',
          serverRevision: latest?.revision,
        });
        return;
      }
    } else {
      try {
        await db.collection('monthlyOutcomes').insertOne({
          ...outcomeDoc,
          createdAt: now,
        });
      } catch (insertErr: any) {
        if (insertErr.code === 11000) {
          const latest = await db.collection('monthlyOutcomes').findOne({
            orgId: user.orgId!,
            studentId: user.userId,
            monthKey: month,
          });
          res.status(409).json({
            code: 'CONFLICT',
            message: 'Monthly outcome created concurrently.',
            serverRevision: latest?.revision,
          });
          return;
        }
        throw insertErr;
      }
    }

    res.json({ success: true, outcome: outcomeDoc });
  } catch (err: any) {
    res.status(400).json({ code: 'SAVE_FAILED', message: err.message });
  }
});

// POST /api/v1/monthly-outcomes/:month/submit
monthlyOutcomesRouter.post('/:month/submit', requirePermission(PERMISSIONS.MONTHLY_OUTCOME_SUBMIT_OWN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = req.params.month as string;
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.collection('monthlyOutcomes').findOne({
      orgId: user.orgId!,
      studentId: user.userId,
      monthKey: month,
    });

    // Enforce lifecycle state transition: can only submit from draft or returned
    if (existing && ['submitted', 'in_review', 'acknowledged'].includes(existing.status)) {
      res.status(400).json({
        code: 'INVALID_STATE_TRANSITION',
        message: 'Report is already submitted or reviewed.',
      });
      return;
    }

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
      derivedValues: { ...derivedValues },
      dailyReportsCount: dailyDocs.length,
      dailyValuesSummary: dailyValuesByDate,
    };

    const nextRevision = existing ? (existing.revision || 1) + 1 : 1;

    await db.collection('monthlyOutcomes').updateOne(
      { orgId: user.orgId!, studentId: user.userId, monthKey: month },
      {
        $set: {
          derivedValues,
          snapshot,
          status: 'submitted',
          isStale: false,
          staleReason: null,
          staleAt: null,
          submittedAt: now,
          revision: nextRevision,
          updatedAt: now,
        },
        $setOnInsert: {
          manualValues: existing?.manualValues || {},
          reflections: existing?.reflections || {},
          createdAt: now,
        },
      },
      { upsert: true }
    );

    // Notify active assigned supervisors
    try {
      const assignments = await db
        .collection('supervisorAssignments')
        .find({
          orgId: user.orgId!,
          studentId: user.userId,
          status: 'active',
        })
        .toArray();

      for (const a of assignments) {
        await createInAppNotification(db, {
          orgId: user.orgId!,
          recipientId: a.supervisorId,
          actorId: user.userId,
          actorName: user.name,
          type: 'report_submitted',
          title: 'নতুন রিপোর্ট জমা হয়েছে',
          message: `${user.name} ${month} মাসের রিপোর্ট পর্যালোচনার জন্য জমা দিয়েছেন।`,
          link: `/supervisor/students/${user.userId}/reports`,
          targetType: 'outcome',
          targetId: month,
          idempotencyKey: `outcome_${user.userId}_${month}_submitted_${nextRevision}`,
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch supervisor notification:', notifErr);
    }

    // Record audit event
    await logAuditEvent(db, {
      orgId: user.orgId!,
      actorId: user.userId,
      actorRole: user.roles[0],
      action: 'report.submitted',
      entityType: 'monthlyOutcome',
      entityId: `${user.userId}_${month}`,
      metadata: {
        monthKey: month,
        dailyReportsCount: dailyDocs.length,
        revision: nextRevision,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Monthly report submitted for supervisor review.',
      snapshot,
    });
  } catch (err: any) {
    res.status(400).json({ code: 'SUBMISSION_FAILED', message: err.message });
  }
});
