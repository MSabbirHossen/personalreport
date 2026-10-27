import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import { SaveDailyReportInputSchema } from '@reportbd/shared';

export const dailyReportsRouter = Router();

// GET /api/v1/daily-reports?month=YYYY-MM
dailyReportsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { month } = req.query;
    if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ code: 'INVALID_MONTH', message: 'Query parameter month=YYYY-MM is required' });
      return;
    }

    const user = req.user!;
    const db = await getDb();

    // Query all reports for this student in this month: dateKey regex ^YYYY-MM-
    const regex = new RegExp(`^${month}-\\d{2}$`);
    const reports = await db
      .collection('dailyReports')
      .find({
        orgId: user.orgId!,
        studentId: user.userId,
        dateKey: { $regex: regex },
      })
      .toArray();

    // Map into keyed object { "2026-09-01": reportDoc, ... }
    const reportsByDate: Record<string, any> = {};
    for (const r of reports) {
      reportsByDate[r.dateKey] = {
        dateKey: r.dateKey,
        values: r.values,
        revision: r.revision || 1,
        status: r.status || 'saved',
        templateVersionId: r.templateVersionId,
        lastSavedAt: r.lastSavedAt,
        createdAt: r.createdAt || r.lastSavedAt,
        updatedAt: r.updatedAt || r.lastSavedAt,
      };
    }

    res.json({ month, reports: reportsByDate });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// GET /api/v1/daily-reports/:date
dailyReportsRouter.get('/:date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const date = req.params.date as string;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ code: 'INVALID_DATE', message: 'Date format must be YYYY-MM-DD' });
      return;
    }

    const user = req.user!;
    const db = await getDb();

    const report = await db.collection('dailyReports').findOne({
      orgId: user.orgId!,
      studentId: user.userId,
      dateKey: date,
    });

    if (!report) {
      res.json({
        dateKey: date,
        values: {},
        revision: 0,
        status: 'empty',
      });
      return;
    }

    res.json({
      dateKey: report.dateKey,
      values: report.values,
      revision: report.revision,
      status: report.status,
      templateVersionId: report.templateVersionId,
      lastSavedAt: report.lastSavedAt,
      createdAt: report.createdAt || report.lastSavedAt,
      updatedAt: report.updatedAt || report.lastSavedAt,
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// PUT /api/v1/daily-reports/:date
dailyReportsRouter.put('/:date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const date = req.params.date as string;
    const body = SaveDailyReportInputSchema.parse({ ...req.body, dateKey: date });
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.collection('dailyReports').findOne({
      orgId: user.orgId!,
      studentId: user.userId,
      dateKey: date,
    });

    const isCorrection = !!existing;
    const nextRevision = existing ? (existing.revision || 1) + 1 : 1;

    // Optimistic concurrency check if client sent a revision
    if (existing && body.revision !== undefined && body.revision !== existing.revision) {
      res.status(409).json({
        code: 'CONFLICT',
        message: 'The report has been modified on another device. Please reload.',
        serverRevision: existing.revision,
        serverValues: existing.values,
      });
      return;
    }

    const reportDoc = {
      orgId: user.orgId!,
      studentId: user.userId,
      dateKey: date,
      templateVersionId: body.templateVersionId || 'default_v1',
      values: body.values,
      revision: nextRevision,
      status: isCorrection ? 'corrected' : 'saved',
      lastSavedAt: now,
      updatedAt: now,
    };

    if (existing) {
      const updateResult = await db.collection('dailyReports').updateOne(
        {
          orgId: user.orgId!,
          studentId: user.userId,
          dateKey: date,
          revision: existing.revision,
        },
        {
          $set: reportDoc,
        }
      );

      if (updateResult.matchedCount === 0) {
        const latest = await db.collection('dailyReports').findOne({
          orgId: user.orgId!,
          studentId: user.userId,
          dateKey: date,
        });
        res.status(409).json({
          code: 'CONFLICT',
          message: 'Concurrent update conflict detected. The report was modified by another request.',
          serverRevision: latest?.revision,
          serverValues: latest?.values,
        });
        return;
      }
    } else {
      try {
        await db.collection('dailyReports').insertOne({
          ...reportDoc,
          createdAt: now,
        });
      } catch (insertErr: any) {
        if (insertErr.code === 11000) {
          const latest = await db.collection('dailyReports').findOne({
            orgId: user.orgId!,
            studentId: user.userId,
            dateKey: date,
          });
          res.status(409).json({
            code: 'CONFLICT',
            message: 'A report for this date was created concurrently.',
            serverRevision: latest?.revision,
            serverValues: latest?.values,
          });
          return;
        }
        throw insertErr;
      }
    }

    // Save revision audit log if it's a correction
    if (isCorrection) {
      await db.collection('dailyReportRevisions').insertOne({
        orgId: user.orgId!,
        studentId: user.userId,
        dateKey: date,
        revision: nextRevision,
        oldValues: existing.values,
        newValues: body.values,
        changedBy: user.userId,
        reason: body.reason || 'User update',
        timestamp: now,
      });
    }

    // Stale snapshot detection: check if a submitted monthly outcome exists for this month
    const monthKey = date.substring(0, 7);
    const submittedOutcome = await db.collection('monthlyOutcomes').findOne({
      orgId: user.orgId!,
      studentId: user.userId,
      monthKey,
    });

    if (
      submittedOutcome &&
      ['submitted', 'in_review', 'acknowledged'].includes(submittedOutcome.status)
    ) {
      await db.collection('monthlyOutcomes').updateOne(
        {
          _id: submittedOutcome._id,
          orgId: user.orgId!,
        },
        {
          $set: {
            isStale: true,
            staleReason: `Daily report for ${date} was updated after submission.`,
            staleAt: now,
            updatedAt: now,
          },
        }
      );
    }

    res.json({
      success: true,
      report: {
        ...reportDoc,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError' || err.issues) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: err.errors?.[0]?.message || err.message || 'Validation error',
        errors: err.errors || err.issues,
      });
      return;
    }
    res.status(400).json({ code: 'SAVE_FAILED', message: err.message });
  }
});

// GET /api/v1/daily-reports/:date/revisions
dailyReportsRouter.get('/:date/revisions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const date = req.params.date as string;
    const user = req.user!;
    const db = await getDb();

    const revisions = await db
      .collection('dailyReportRevisions')
      .find({
        orgId: user.orgId!,
        studentId: user.userId,
        dateKey: date,
      })
      .sort({ timestamp: -1 })
      .toArray();

    res.json({ revisions });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});
