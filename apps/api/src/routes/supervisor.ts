import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import { ReviewOutcomeInputSchema, CreateAdviceInputSchema } from '@reportbd/shared';

export const supervisorRouter = Router();

// Enforce supervisor or org_admin role
supervisorRouter.use(requireRole(['supervisor', 'org_admin', 'platform_admin']));

// GET /api/v1/supervisor/students
supervisorRouter.get('/students', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();

    // Find assigned students for this supervisor in this organization
    const assignments = await db
      .collection('supervisorAssignments')
      .find({
        orgId: user.orgId,
        supervisorId: user.userId,
        status: 'active',
      })
      .toArray();

    const studentIds = assignments.map((a) => {
      try {
        return new ObjectId(a.studentId);
      } catch {
        return null;
      }
    }).filter(Boolean);

    const students = await db
      .collection('users')
      .find({ _id: { $in: studentIds } })
      .toArray();

    res.json({
      students: students.map((s) => ({
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

// POST /api/v1/supervisor/reviews/:outcomeId
supervisorRouter.post('/reviews/:outcomeId', async (req: AuthenticatedRequest, res: Response) => {
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

    // 2. Verify assignment: Supervisors may only review currently assigned students
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

    await db.collection('monthlyOutcomes').updateOne(
      { _id: objectId, orgId: user.orgId },
      {
        $set: {
          status: newStatus,
          reviewedAt: now,
          reviewedBy: user.userId,
          reviewFeedback: body.feedback,
          updatedAt: now,
        },
      }
    );

    // If feedback provided, automatically add to advice
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

    res.json({ success: true, message: `Report marked as ${newStatus}` });
  } catch (err: any) {
    res.status(400).json({ code: 'REVIEW_FAILED', message: err.message });
  }
});

// POST /api/v1/supervisor/advice
supervisorRouter.post('/advice', async (req: AuthenticatedRequest, res: Response) => {
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
      createdAt: now,
    };

    const insertResult = await db.collection('advice').insertOne(adviceDoc);

    res.json({
      success: true,
      advice: { id: insertResult.insertedId.toString(), ...adviceDoc },
    });
  } catch (err: any) {
    res.status(400).json({ code: 'ADVICE_FAILED', message: err.message });
  }
});
