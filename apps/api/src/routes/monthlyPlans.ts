import { Router, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import { SaveMonthlyPlanInputSchema, PERMISSIONS } from '@reportbd/shared';
import { logAuditEvent } from '../services/audit.js';

export const monthlyPlansRouter = Router();

// GET /api/v1/monthly-plans/:month
monthlyPlansRouter.get('/:month', requirePermission(PERMISSIONS.MONTHLY_PLAN_READ_OWN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = req.params.month as string;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ code: 'INVALID_MONTH', message: 'Month format must be YYYY-MM' });
      return;
    }

    const user = req.user!;
    const db = await getDb();

    const plan = await db.collection('monthlyPlans').findOne({
      orgId: user.orgId!,
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
monthlyPlansRouter.put('/:month', requirePermission(PERMISSIONS.MONTHLY_PLAN_WRITE_OWN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = req.params.month as string;
    const body = SaveMonthlyPlanInputSchema.parse({ ...req.body, monthKey: month });
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.collection('monthlyPlans').findOne({
      orgId: user.orgId!,
      studentId: user.userId,
      monthKey: month,
    });

    // Check if plan has been acknowledged by supervisor
    if (existing?.status === 'acknowledged') {
      res.status(400).json({
        code: 'PLAN_LOCKED',
        message: 'This monthly plan has already been acknowledged by your supervisor and cannot be modified.',
      });
      return;
    }

    // Optimistic concurrency check
    if (existing && body.revision !== undefined && body.revision !== existing.revision) {
      res.status(409).json({
        code: 'CONFLICT',
        message: 'The monthly plan has been modified on another device. Please reload.',
        serverRevision: existing.revision,
        serverTargets: existing.targets,
      });
      return;
    }

    const nextRevision = existing ? (existing.revision || 1) + 1 : 1;

    const planDoc = {
      orgId: user.orgId!,
      studentId: user.userId,
      monthKey: month,
      targets: body.targets,
      notes: body.notes,
      status: existing?.status || 'draft',
      revision: nextRevision,
      updatedAt: now,
    };

    if (existing) {
      const updateResult = await db.collection('monthlyPlans').updateOne(
        {
          orgId: user.orgId!,
          studentId: user.userId,
          monthKey: month,
          revision: existing.revision,
        },
        {
          $set: planDoc,
        }
      );

      if (updateResult.matchedCount === 0) {
        const latest = await db.collection('monthlyPlans').findOne({
          orgId: user.orgId!,
          studentId: user.userId,
          monthKey: month,
        });
        res.status(409).json({
          code: 'CONFLICT',
          message: 'Concurrent update conflict detected. The plan was modified by another request.',
          serverRevision: latest?.revision,
          serverTargets: latest?.targets,
        });
        return;
      }
    } else {
      try {
        await db.collection('monthlyPlans').insertOne({
          ...planDoc,
          createdAt: now,
        });
      } catch (insertErr: any) {
        if (insertErr.code === 11000) {
          const latest = await db.collection('monthlyPlans').findOne({
            orgId: user.orgId!,
            studentId: user.userId,
            monthKey: month,
          });
          res.status(409).json({
            code: 'CONFLICT',
            message: 'A plan for this month was created concurrently.',
            serverRevision: latest?.revision,
            serverTargets: latest?.targets,
          });
          return;
        }
        throw insertErr;
      }
    }

    res.json({ success: true, plan: planDoc });
  } catch (err: any) {
    res.status(400).json({ code: 'SAVE_FAILED', message: err.message });
  }
});

// POST /api/v1/monthly-plans/:month/share
monthlyPlansRouter.post('/:month/share', requirePermission(PERMISSIONS.MONTHLY_PLAN_SHARE_OWN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = req.params.month as string;
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    const result = await db.collection('monthlyPlans').updateOne(
      { orgId: user.orgId!, studentId: user.userId, monthKey: month },
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

    // Record audit event
    await logAuditEvent(db, {
      orgId: user.orgId!,
      actorId: user.userId,
      actorRole: user.roles[0],
      action: 'plan.shared',
      entityType: 'monthlyPlan',
      entityId: `${user.userId}_${month}`,
      metadata: { monthKey: month },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Plan shared with supervisor' });
  } catch (err: any) {
    res.status(400).json({ code: 'SHARE_FAILED', message: err.message });
  }
});
