import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import { CreateInvitationInputSchema, AssignSupervisorInputSchema } from '@reportbd/shared';

export const organizationRouter = Router();

// Enforce org_admin role
organizationRouter.use(requireRole(['org_admin', 'platform_admin']));

// GET /api/v1/organization/users
organizationRouter.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();

    const memberships = await db
      .collection('memberships')
      .find({ orgId: user.orgId })
      .toArray();

    res.json({ users: memberships });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// POST /api/v1/organization/assignments
organizationRouter.post('/assignments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const body = AssignSupervisorInputSchema.parse(req.body);
    const db = await getDb();
    const now = new Date().toISOString();

    const assignmentDoc = {
      orgId: user.orgId,
      studentId: body.studentId,
      supervisorId: body.supervisorId,
      startAt: body.startAt || now,
      status: 'active',
      createdAt: now,
    };

    await db.collection('supervisorAssignments').insertOne(assignmentDoc);

    res.json({ success: true, assignment: assignmentDoc });
  } catch (err: any) {
    res.status(400).json({ code: 'ASSIGNMENT_FAILED', message: err.message });
  }
});
