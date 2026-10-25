import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import { ReplyAdviceInputSchema } from '@reportbd/shared';
import { createInAppNotification } from '../services/notifications.js';
import { logAuditEvent } from '../services/audit.js';

export const adviceRouter = Router();

// GET /api/v1/advice
adviceRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();
    const queryStudentId = req.query.studentId as string | undefined;
    const queryMonthKey = req.query.monthKey as string | undefined;

    let targetStudentId = user.userId;

    // If supervisor or admin wants to view advice for a specific student
    if (queryStudentId && queryStudentId !== user.userId) {
      if (!user.roles.includes('supervisor') && !user.roles.includes('org_admin') && !user.roles.includes('platform_admin')) {
        res.status(403).json({ code: 'FORBIDDEN', message: 'Not authorized to view other students advice.' });
        return;
      }

      // If supervisor, verify assignment
      if (!user.roles.includes('org_admin') && !user.roles.includes('platform_admin')) {
        const assignment = await db.collection('supervisorAssignments').findOne({
          orgId: user.orgId!,
          supervisorId: user.userId,
          studentId: queryStudentId,
          status: 'active',
        });

        if (!assignment) {
          res.status(403).json({ code: 'FORBIDDEN', message: 'You are not assigned to this student.' });
          return;
        }
      }

      targetStudentId = queryStudentId;
    }

    const query: any = {
      orgId: user.orgId!,
      studentId: targetStudentId,
    };

    if (queryMonthKey) {
      query.monthKey = queryMonthKey;
    }

    const adviceList = await db
      .collection('advice')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      advice: adviceList.map((a: any) => ({
        id: a._id.toString(),
        studentId: a.studentId,
        authorName: a.authorName,
        authorRole: a.authorRole,
        authorId: a.authorId,
        targetType: a.targetType,
        targetId: a.targetId,
        monthKey: a.monthKey,
        body: a.body,
        isAcknowledged: Boolean(a.isAcknowledged),
        acknowledgedAt: a.acknowledgedAt || null,
        replies: a.replies || [],
        createdAt: a.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// POST /api/v1/advice/:id/acknowledge
adviceRouter.post('/:id/acknowledge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      res.status(400).json({ code: 'INVALID_ID', message: 'Malformed advice identifier.' });
      return;
    }

    const result = await db.collection('advice').updateOne(
      { _id: objectId, studentId: user.userId, orgId: user.orgId! },
      {
        $set: {
          isAcknowledged: true,
          acknowledgedAt: now,
          updatedAt: now,
        },
      }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Advice item not found.' });
      return;
    }

    res.json({ success: true, message: 'Advice acknowledged.' });
  } catch (err: any) {
    res.status(400).json({ code: 'ACKNOWLEDGE_FAILED', message: err.message });
  }
});

// POST /api/v1/advice/:id/reply
adviceRouter.post('/:id/reply', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const body = ReplyAdviceInputSchema.parse(req.body);
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      res.status(400).json({ code: 'INVALID_ID', message: 'Malformed advice identifier.' });
      return;
    }

    const advice = await db.collection('advice').findOne({
      _id: objectId,
      orgId: user.orgId!,
    });

    if (!advice) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Advice thread not found.' });
      return;
    }

    // Verify user is an authorized participant (either the student or the assigned supervisor)
    const isStudent = advice.studentId === user.userId;
    let isAuthorizedSupervisor = advice.authorId === user.userId || user.roles.includes('org_admin');

    if (!isStudent && !isAuthorizedSupervisor) {
      const assignment = await db.collection('supervisorAssignments').findOne({
        orgId: user.orgId!,
        supervisorId: user.userId,
        studentId: advice.studentId,
        status: 'active',
      });
      if (assignment) {
        isAuthorizedSupervisor = true;
      }
    }

    if (!isStudent && !isAuthorizedSupervisor) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'You are not authorized to reply to this advice.' });
      return;
    }

    const replyItem = {
      id: new ObjectId().toString(),
      authorId: user.userId,
      authorName: user.name,
      authorRole: isStudent ? 'Student' : (user.roles.includes('org_admin') ? 'Admin' : 'Supervisor'),
      body: body.body,
      createdAt: now,
    };

    const existingReplies = advice.replies || [];
    const updatedReplies = [...existingReplies, replyItem];

    await db.collection('advice').updateOne(
      { _id: objectId, orgId: user.orgId! },
      {
        $set: {
          replies: updatedReplies,
          updatedAt: now,
        },
      }
    );

    // Notify the other party
    const recipientId = isStudent ? advice.authorId : advice.studentId;
    const notifTitle = isStudent ? 'পরামর্শে শিক্ষার্থীর উত্তর' : 'পরামর্শে পর্যবেক্ষকের মন্তব্য';
    const notifMsg = `${user.name}: "${body.body.substring(0, 80)}${body.body.length > 80 ? '...' : ''}"`;

    try {
      await createInAppNotification(db, {
        orgId: user.orgId!,
        recipientId,
        actorId: user.userId,
        actorName: user.name,
        type: 'advice_received',
        title: notifTitle,
        message: notifMsg,
        link: isStudent ? `/supervisor/students/${advice.studentId}/reports` : '/app/advice',
        targetType: 'advice',
        targetId: id,
        idempotencyKey: `advice_reply_${id}_${replyItem.id}`,
      });
    } catch (notifErr) {
      console.error('Failed to dispatch advice reply notification:', notifErr);
    }

    // Record audit event
    await logAuditEvent(db, {
      orgId: user.orgId!,
      actorId: user.userId,
      actorRole: user.roles[0],
      action: 'advice.replied',
      entityType: 'advice',
      entityId: id,
      metadata: {
        studentId: advice.studentId,
        replyAuthorRole: replyItem.authorRole,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Reply posted successfully.',
      reply: replyItem,
    });
  } catch (err: any) {
    res.status(400).json({ code: 'REPLY_FAILED', message: err.message });
  }
});
