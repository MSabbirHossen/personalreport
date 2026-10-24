import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
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
      .find({ orgId: user.orgId! })
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
      orgId: user.orgId!,
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

// POST /api/v1/organization/invitations — Generate expiring single-use invitation
organizationRouter.post('/invitations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const body = CreateInvitationInputSchema.parse(req.body);
    const db = await getDb();
    const now = new Date();
    const nowIso = now.toISOString();

    // Security check: Org admins cannot grant platform_admin
    if (body.role === 'org_admin' && !user.roles.includes('platform_admin') && !user.roles.includes('org_admin')) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'You cannot delegate this role.' });
      return;
    }

    const email = body.email.toLowerCase().trim();

    // Check if user with this email already has an active membership in this org
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      const existingMembership = await db.collection('memberships').findOne({
        orgId: user.orgId!,
        userId: existingUser._id.toString(),
        status: 'active',
      });
      if (existingMembership) {
        res.status(409).json({
          code: 'ALREADY_MEMBER',
          message: 'This user is already an active member of this organization.',
        });
        return;
      }
    }

    // Generate cryptographically secure token
    const token = crypto.randomBytes(24).toString('hex');
    const expiresInDays = body.expiresInDays || 7;
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const invitationDoc = {
      orgId: user.orgId!,
      email,
      role: body.role,
      branchId: body.branchId || undefined,
      membershipLevelId: body.membershipLevelId || undefined,
      token,
      status: 'pending',
      createdBy: user.userId,
      expiresAt,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const insertResult = await db.collection('invitations').insertOne(invitationDoc);

    res.json({
      success: true,
      invitation: {
        id: insertResult.insertedId.toString(),
        ...invitationDoc,
      },
    });
  } catch (err: any) {
    res.status(400).json({ code: 'INVITATION_CREATION_FAILED', message: err.message });
  }
});

// GET /api/v1/organization/invitations — List invitations for organization
organizationRouter.get('/invitations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();

    const invitations = await db
      .collection('invitations')
      .find({ orgId: user.orgId! })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      invitations: invitations.map((inv) => ({
        id: inv._id.toString(),
        email: inv.email,
        role: inv.role,
        branchId: inv.branchId,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// DELETE /api/v1/organization/invitations/:id — Revoke a pending invitation
organizationRouter.delete('/invitations/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const db = await getDb();
    const nowIso = new Date().toISOString();

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      res.status(400).json({ code: 'INVALID_ID', message: 'Malformed invitation ID' });
      return;
    }

    const result = await db.collection('invitations').updateOne(
      { _id: objectId, orgId: user.orgId!, status: 'pending' },
      { $set: { status: 'revoked', updatedAt: nowIso } }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Pending invitation not found or already processed.' });
      return;
    }

    res.json({ success: true, message: 'Invitation revoked successfully.' });
  } catch (err: any) {
    res.status(500).json({ code: 'REVOCATION_FAILED', message: err.message });
  }
});
