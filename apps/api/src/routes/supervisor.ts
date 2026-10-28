import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { AuthenticatedRequest, requireRole, requirePermission, requireAnyPermission } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import {
  ReviewOutcomeInputSchema,
  CreateAdviceInputSchema,
  SupervisorQueueQuerySchema,
  PERMISSIONS,
} from '@reportbd/shared';
import { createInAppNotification } from '../services/notifications.js';
import { logAuditEvent } from '../services/audit.js';
import { sensitiveOpsLimiter } from '../middleware/rateLimiter.js';

export const supervisorRouter = Router();

// Enforce supervisor permissions
supervisorRouter.use(
  requireAnyPermission([
    PERMISSIONS.SUPERVISOR_DASHBOARD_READ,
    PERMISSIONS.SUPERVISOR_QUEUE_READ,
    PERMISSIONS.SUPERVISOR_STUDENTS_READ,
    PERMISSIONS.SUPERVISOR_REPORT_READ,
    PERMISSIONS.SUPERVISOR_REVIEW_SUBMIT,
    PERMISSIONS.SUPERVISOR_ADVICE_CREATE,
  ])
);

// Helper: Get list of active assigned student IDs for this supervisor
async function getAssignedStudentIds(db: any, orgId: string, supervisorId: string): Promise<string[]> {
  const assignments = await db
    .collection('supervisorAssignments')
    .find({
      orgId,
      supervisorId,
      status: 'active',
    })
    .toArray();

  return assignments.map((a: any) => a.studentId);
}

// GET /api/v1/supervisor/dashboard
supervisorRouter.get('/dashboard', requirePermission(PERMISSIONS.SUPERVISOR_DASHBOARD_READ), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();
    const currentMonth = new Date().toISOString().substring(0, 7);

    const isOrgAdmin = user.roles.includes('org_admin') || user.roles.includes('platform_admin');
    let studentIds: string[] = [];

    if (!isOrgAdmin) {
      studentIds = await getAssignedStudentIds(db, user.orgId!, user.userId);
    } else {
      const allStudents = await db
        .collection('memberships')
        .find({ orgId: user.orgId!, roles: 'student', status: 'active' })
        .toArray();
      studentIds = allStudents.map((m: any) => m.userId);
    }

    const assignedStudentsCount = studentIds.length;

    // Pending reviews: reports awaiting review in 'submitted' state
    const pendingQuery: any = {
      orgId: user.orgId!,
      status: 'submitted',
    };
    if (!isOrgAdmin) {
      pendingQuery.studentId = { $in: studentIds };
    }
    const pendingReviewsCount = await db.collection('monthlyOutcomes').countDocuments(pendingQuery);

    // Reviewed this month
    const reviewedQuery: any = {
      orgId: user.orgId!,
      monthKey: currentMonth,
    };
    if (!isOrgAdmin) {
      reviewedQuery.studentId = { $in: studentIds };
    }
    const acknowledgedThisMonthCount = await db
      .collection('monthlyOutcomes')
      .countDocuments({ ...reviewedQuery, status: 'acknowledged' });
    const returnedThisMonthCount = await db
      .collection('monthlyOutcomes')
      .countDocuments({ ...reviewedQuery, status: 'returned' });

    // Recent queue items (latest 10 submitted)
    const recentDocs = await db
      .collection('monthlyOutcomes')
      .find(pendingQuery)
      .sort({ submittedAt: -1, updatedAt: -1 })
      .limit(10)
      .toArray();

    // Populate student profiles
    const studentObjIds = recentDocs
      .map((r: any) => {
        try {
          return new ObjectId(r.studentId);
        } catch {
          return null;
        }
      })
      .filter((id: any): id is ObjectId => id !== null);

    const usersMap: Record<string, any> = {};
    if (studentObjIds.length > 0) {
      const usersList = await db.collection('users').find({ _id: { $in: studentObjIds } }).toArray();
      for (const u of usersList) {
        usersMap[u._id.toString()] = u;
      }
    }

    const recentQueue = recentDocs.map((r: any) => {
      const student = usersMap[r.studentId] || {};
      return {
        id: r._id.toString(),
        studentId: r.studentId,
        studentName: student.name || 'Unknown',
        studentEmail: student.email || '',
        monthKey: r.monthKey,
        status: r.status,
        submittedAt: r.submittedAt,
        reviewedAt: r.reviewedAt,
        isStale: Boolean(r.isStale),
        staleReason: r.staleReason || null,
        revision: r.revision || 1,
      };
    });

    res.json({
      summary: {
        assignedStudentsCount,
        pendingReviewsCount,
        acknowledgedThisMonthCount,
        returnedThisMonthCount,
        recentQueue,
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// GET /api/v1/supervisor/queue
supervisorRouter.get('/queue', requirePermission(PERMISSIONS.SUPERVISOR_QUEUE_READ), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();
    const queryParams = SupervisorQueueQuerySchema.parse(req.query);

    const isOrgAdmin = user.roles.includes('org_admin') || user.roles.includes('platform_admin');
    let studentIds: string[] = [];

    if (!isOrgAdmin) {
      studentIds = await getAssignedStudentIds(db, user.orgId!, user.userId);
      if (studentIds.length === 0) {
        res.json({ queue: [], total: 0, page: queryParams.page, limit: queryParams.limit });
        return;
      }
    }

    const filter: any = { orgId: user.orgId! };

    if (!isOrgAdmin) {
      filter.studentId = { $in: studentIds };
    }

    if (queryParams.studentId) {
      if (!isOrgAdmin && !studentIds.includes(queryParams.studentId)) {
        res.status(403).json({ code: 'FORBIDDEN', message: 'You are not assigned to this student.' });
        return;
      }
      filter.studentId = queryParams.studentId;
    }

    if (queryParams.monthKey) {
      filter.monthKey = queryParams.monthKey;
    }

    if (queryParams.status && queryParams.status !== 'all') {
      filter.status = queryParams.status;
    }

    const total = await db.collection('monthlyOutcomes').countDocuments(filter);
    const skip = (queryParams.page - 1) * queryParams.limit;

    const docs = await db
      .collection('monthlyOutcomes')
      .find(filter)
      .sort({ submittedAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(queryParams.limit)
      .toArray();

    // Populate student profiles
    const studentObjIds = docs
      .map((r: any) => {
        try {
          return new ObjectId(r.studentId);
        } catch {
          return null;
        }
      })
      .filter((id: any): id is ObjectId => id !== null);

    const usersMap: Record<string, any> = {};
    if (studentObjIds.length > 0) {
      const usersList = await db.collection('users').find({ _id: { $in: studentObjIds } }).toArray();
      for (const u of usersList) {
        usersMap[u._id.toString()] = u;
      }
    }

    const queue = docs.map((r: any) => {
      const student = usersMap[r.studentId] || {};
      return {
        id: r._id.toString(),
        studentId: r.studentId,
        studentName: student.name || 'Unknown',
        studentEmail: student.email || '',
        monthKey: r.monthKey,
        status: r.status,
        submittedAt: r.submittedAt,
        reviewedAt: r.reviewedAt,
        isStale: Boolean(r.isStale),
        staleReason: r.staleReason || null,
        revision: r.revision || 1,
      };
    });

    res.json({
      queue,
      total,
      page: queryParams.page,
      limit: queryParams.limit,
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// GET /api/v1/supervisor/students
supervisorRouter.get('/students', requirePermission(PERMISSIONS.SUPERVISOR_STUDENTS_READ), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();

    const assignments = await db
      .collection('supervisorAssignments')
      .find({
        orgId: user.orgId,
        supervisorId: user.userId,
        status: 'active',
      })
      .toArray();

    const studentIds = assignments
      .map((a: any) => {
        try {
          return new ObjectId(a.studentId);
        } catch {
          return null;
        }
      })
      .filter((id: any): id is ObjectId => id !== null);

    const students = await db
      .collection('users')
      .find({ _id: { $in: studentIds } })
      .toArray();

    res.json({
      students: students.map((s: any) => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        photoUrl: s.photoUrl,
        profile: s.profile,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// GET /api/v1/supervisor/students/:studentId/reports
supervisorRouter.get('/students/:studentId/reports', requirePermission(PERMISSIONS.SUPERVISOR_REPORT_READ), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId as string;
    const user = req.user!;
    const db = await getDb();

    if (!user.roles.includes('org_admin') && !user.roles.includes('platform_admin')) {
      const assignment = await db.collection('supervisorAssignments').findOne({
        orgId: user.orgId,
        supervisorId: user.userId,
        studentId: studentId,
        status: 'active',
      });

      if (!assignment) {
        res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You are not assigned to this student.',
        });
        return;
      }
    }

    const reports = await db
      .collection('monthlyOutcomes')
      .find({
        orgId: user.orgId,
        studentId: studentId,
      })
      .sort({ monthKey: -1 })
      .toArray();

    res.json({
      studentId,
      reports: reports.map((r: any) => ({
        id: r._id.toString(),
        monthKey: r.monthKey,
        status: r.status,
        derivedValues: r.snapshot?.derivedValues || r.derivedValues,
        manualValues: r.manualValues || {},
        reflections: r.reflections || {},
        submittedAt: r.submittedAt,
        reviewedAt: r.reviewedAt,
        isStale: Boolean(r.isStale),
        staleReason: r.staleReason || null,
        snapshot: r.snapshot,
        revision: r.revision || 1,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// GET /api/v1/supervisor/reports/:outcomeId
supervisorRouter.get('/reports/:outcomeId', requirePermission(PERMISSIONS.SUPERVISOR_REPORT_READ), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const outcomeId = req.params.outcomeId as string;
    const user = req.user!;
    const db = await getDb();

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(outcomeId);
    } catch {
      res.status(400).json({ code: 'INVALID_ID', message: 'Malformed outcome identifier.' });
      return;
    }

    const outcome = await db.collection('monthlyOutcomes').findOne({
      _id: objectId,
      orgId: user.orgId,
    });

    if (!outcome) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Monthly report not found.' });
      return;
    }

    // Verify assignment authorization
    if (!user.roles.includes('org_admin') && !user.roles.includes('platform_admin')) {
      const assignment = await db.collection('supervisorAssignments').findOne({
        orgId: user.orgId,
        supervisorId: user.userId,
        studentId: outcome.studentId,
        status: 'active',
      });

      if (!assignment) {
        res.status(403).json({ code: 'FORBIDDEN', message: 'You are not assigned to review this student.' });
        return;
      }
    }

    // Student profile
    let studentUser: any = null;
    try {
      studentUser = await db.collection('users').findOne({ _id: new ObjectId(outcome.studentId) });
    } catch {
      studentUser = await db.collection('users').findOne({ _id: outcome.studentId });
    }

    // Monthly plan targets for comparison
    const plan = await db.collection('monthlyPlans').findOne({
      orgId: user.orgId,
      studentId: outcome.studentId,
      monthKey: outcome.monthKey,
    });

    // Associated advice history
    const adviceList = await db
      .collection('advice')
      .find({
        orgId: user.orgId,
        studentId: outcome.studentId,
        monthKey: outcome.monthKey,
      })
      .sort({ createdAt: 1 })
      .toArray();

    res.json({
      outcome: {
        id: outcome._id.toString(),
        studentId: outcome.studentId,
        monthKey: outcome.monthKey,
        status: outcome.status,
        derivedValues: outcome.snapshot?.derivedValues || outcome.derivedValues,
        manualValues: outcome.manualValues || {},
        reflections: outcome.reflections || {},
        isStale: Boolean(outcome.isStale),
        staleReason: outcome.staleReason || null,
        staleAt: outcome.staleAt || null,
        snapshot: outcome.snapshot || null,
        submittedAt: outcome.submittedAt || null,
        reviewedAt: outcome.reviewedAt || null,
        reviewedBy: outcome.reviewedBy || null,
        reviewFeedback: outcome.reviewFeedback || null,
        revision: outcome.revision || 1,
      },
      student: {
        id: outcome.studentId,
        name: studentUser?.name || 'Unknown',
        email: studentUser?.email || '',
        profile: studentUser?.profile || {},
      },
      plan: plan
        ? {
            targets: plan.targets || {},
            status: plan.status,
            revision: plan.revision,
          }
        : null,
      adviceHistory: adviceList.map((a: any) => ({
        id: a._id.toString(),
        authorName: a.authorName,
        authorRole: a.authorRole,
        body: a.body,
        createdAt: a.createdAt,
        replies: a.replies || [],
      })),
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// POST /api/v1/supervisor/reviews/:outcomeId
supervisorRouter.post('/reviews/:outcomeId', sensitiveOpsLimiter, requirePermission(PERMISSIONS.SUPERVISOR_REVIEW_SUBMIT), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const outcomeId = req.params.outcomeId as string;
    const body = ReviewOutcomeInputSchema.parse({ ...req.body, outcomeId });
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(outcomeId);
    } catch {
      res.status(400).json({ code: 'INVALID_ID', message: 'Malformed outcome identifier.' });
      return;
    }

    // 1. Fetch outcome to verify tenant and target student
    const outcome = await db.collection('monthlyOutcomes').findOne({
      _id: objectId,
      orgId: user.orgId,
    });

    if (!outcome) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Monthly outcome not found' });
      return;
    }

    // 2. Lifecycle check: Cannot review unsubmitted drafts
    if (outcome.status === 'draft') {
      res.status(400).json({
        code: 'INVALID_STATUS',
        message: 'Cannot review an unsubmitted draft report.',
      });
      return;
    }

    // 3. Verify assignment: Supervisors may only review currently assigned students
    if (!user.roles.includes('org_admin') && !user.roles.includes('platform_admin')) {
      const assignment = await db.collection('supervisorAssignments').findOne({
        orgId: user.orgId,
        supervisorId: user.userId,
        studentId: outcome.studentId,
        status: 'active',
      });

      if (!assignment) {
        res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You are not assigned to review this student.',
        });
        return;
      }
    }

    const newStatus = body.action === 'acknowledge' ? 'acknowledged' : 'returned';

    // 4. Atomic conditional update:
    // Only match reports in reviewable states ('submitted' or 'in_review').
    // If revision is provided, verify matching revision.
    const updateCondition: any = {
      _id: objectId,
      orgId: user.orgId,
      status: { $in: ['submitted', 'in_review'] },
    };
    if (body.revision !== undefined) {
      updateCondition.revision = body.revision;
    }

    const updateResult = await db.collection('monthlyOutcomes').updateOne(
      updateCondition,
      {
        $set: {
          status: newStatus,
          reviewedAt: now,
          reviewedBy: user.userId,
          reviewedByName: user.name,
          reviewFeedback: body.feedback || null,
          updatedAt: now,
        },
        $inc: { revision: 1 },
      }
    );

    // 5. Concurrency Conflict Handling
    if (updateResult.matchedCount === 0) {
      const current = await db.collection('monthlyOutcomes').findOne({
        _id: objectId,
        orgId: user.orgId,
      });

      if (!current) {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Monthly outcome not found.' });
        return;
      }

      if (['acknowledged', 'returned'].includes(current.status)) {
        res.status(409).json({
          code: 'ALREADY_REVIEWED',
          message: `This report was already reviewed by another supervisor (Status: ${current.status}).`,
          currentStatus: current.status,
          serverRevision: current.revision,
        });
        return;
      }

      res.status(409).json({
        code: 'CONFLICT',
        message: 'Report was modified concurrently by another user or session. Please reload.',
        currentStatus: current.status,
        serverRevision: current.revision,
      });
      return;
    }

    // 6. Record feedback in advice thread if provided
    if (body.feedback) {
      await db.collection('advice').insertOne({
        orgId: user.orgId,
        studentId: outcome.studentId,
        authorId: user.userId,
        authorName: user.name,
        authorRole: user.roles.includes('org_admin') ? 'Admin' : 'Supervisor',
        targetType: 'outcome',
        targetId: outcomeId,
        monthKey: outcome.monthKey,
        body: body.feedback,
        isAcknowledged: false,
        createdAt: now,
      });
    }

    // 7. Trigger in-app notification to student (idempotent)
    const notifType = body.action === 'acknowledge' ? 'report_acknowledged' : 'report_returned';
    const notifTitle = body.action === 'acknowledge' ? 'রিপোর্ট অনুমোদিত হয়েছে' : 'রিপোর্ট সংশোধনের জন্য ফেরত';
    const notifMsg =
      body.action === 'acknowledge'
        ? `${user.name} আপনার ${outcome.monthKey} মাসের রিপোর্ট অনুমোদন করেছেন।`
        : `${user.name} আপনার ${outcome.monthKey} মাসের রিপোর্ট সংশোধনের জন্য ফেরত পাঠিয়েছেন।`;

    const updatedRevision = (outcome.revision || 1) + 1;

    try {
      await createInAppNotification(db, {
        orgId: user.orgId!,
        recipientId: outcome.studentId,
        actorId: user.userId,
        actorName: user.name,
        type: notifType,
        title: notifTitle,
        message: notifMsg,
        link: `/app/reports/monthly-outcome?month=${outcome.monthKey}`,
        targetType: 'outcome',
        targetId: outcomeId,
        idempotencyKey: `outcome_${outcomeId}_${notifType}_${updatedRevision}`,
      });
    } catch (notifErr) {
      console.error('Failed to dispatch student review notification:', notifErr);
    }

    // Record audit event
    await logAuditEvent(db, {
      orgId: user.orgId!,
      actorId: user.userId,
      actorRole: user.roles[0],
      action: body.action === 'acknowledge' ? 'review.acknowledged' : 'review.returned',
      entityType: 'monthlyOutcome',
      entityId: outcomeId,
      metadata: {
        studentId: outcome.studentId,
        monthKey: outcome.monthKey,
        action: body.action,
        status: newStatus,
        feedback: body.feedback,
        revision: updatedRevision,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: `Report marked as ${newStatus}`,
      status: newStatus,
      reviewedAt: now,
      revision: updatedRevision,
    });
  } catch (err: any) {
    res.status(400).json({ code: 'REVIEW_FAILED', message: err.message });
  }
});

// POST /api/v1/supervisor/advice
supervisorRouter.post('/advice', requirePermission(PERMISSIONS.SUPERVISOR_ADVICE_CREATE), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = CreateAdviceInputSchema.parse(req.body);
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    // Verify supervisor is assigned to this student
    if (!user.roles.includes('org_admin') && !user.roles.includes('platform_admin')) {
      const assignment = await db.collection('supervisorAssignments').findOne({
        orgId: user.orgId,
        supervisorId: user.userId,
        studentId: body.studentId,
        status: 'active',
      });

      if (!assignment) {
        res.status(403).json({ code: 'FORBIDDEN', message: 'You are not assigned to this student.' });
        return;
      }
    }

    const adviceDoc = {
      orgId: user.orgId,
      studentId: body.studentId,
      authorId: user.userId,
      authorName: user.name,
      authorRole: user.roles.includes('org_admin') ? 'Admin' : 'Supervisor',
      targetType: body.targetType,
      targetId: body.targetId,
      monthKey: body.monthKey,
      body: body.body,
      isAcknowledged: false,
      replies: [],
      createdAt: now,
    };

    const insertResult = await db.collection('advice').insertOne(adviceDoc);
    const adviceId = insertResult.insertedId.toString();

    // Trigger notification to student
    try {
      await createInAppNotification(db, {
        orgId: user.orgId!,
        recipientId: body.studentId,
        actorId: user.userId,
        actorName: user.name,
        type: 'advice_received',
        title: 'নতুন পরামর্শ প্রাপ্তি',
        message: `${user.name} আপনাকে নতুন পরামর্শ দিয়েছেন।`,
        link: '/app/advice',
        targetType: 'advice',
        targetId: adviceId,
        idempotencyKey: `advice_${adviceId}`,
      });
    } catch (notifErr) {
      console.error('Failed to dispatch advice notification:', notifErr);
    }

    // Record audit event
    await logAuditEvent(db, {
      orgId: user.orgId!,
      actorId: user.userId,
      actorRole: user.roles[0],
      action: 'advice.created',
      entityType: 'advice',
      entityId: adviceId,
      metadata: {
        studentId: body.studentId,
        monthKey: body.monthKey,
        targetType: body.targetType,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      advice: { id: adviceId, ...adviceDoc },
    });
  } catch (err: any) {
    res.status(400).json({ code: 'ADVICE_FAILED', message: err.message });
  }
});
