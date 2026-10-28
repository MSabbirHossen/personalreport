import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { AuthenticatedRequest, requireRole, requirePermission, requireAnyPermission } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import {
  CreateInvitationInputSchema,
  AssignSupervisorInputSchema,
  AuditEventsQuerySchema,
  PERMISSIONS,
} from '@reportbd/shared';
import { logAuditEvent } from '../services/audit.js';
import { inviteRateLimiter, sensitiveOpsLimiter } from '../middleware/rateLimiter.js';

export const organizationRouter = Router();

// Enforce org_admin permissions
organizationRouter.use(
  requireAnyPermission([
    PERMISSIONS.ORG_USERS_READ,
    PERMISSIONS.ORG_ASSIGNMENTS_MANAGE,
    PERMISSIONS.ORG_INVITATIONS_MANAGE,
    PERMISSIONS.ORG_AUDIT_READ,
  ])
);

// GET /api/v1/organization/users
organizationRouter.get('/users', requirePermission(PERMISSIONS.ORG_USERS_READ), async (req: AuthenticatedRequest, res: Response) => {
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
organizationRouter.post('/assignments', requirePermission(PERMISSIONS.ORG_ASSIGNMENTS_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
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

    const insertResult = await db.collection('supervisorAssignments').insertOne(assignmentDoc);

    // Record audit event
    await logAuditEvent(db, {
      orgId: user.orgId!,
      actorId: user.userId,
      actorRole: user.roles[0],
      action: 'assignment.created',
      entityType: 'supervisorAssignment',
      entityId: insertResult.insertedId.toString(),
      metadata: {
        studentId: body.studentId,
        supervisorId: body.supervisorId,
        startAt: body.startAt || now,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, assignment: assignmentDoc });
  } catch (err: any) {
    res.status(400).json({ code: 'ASSIGNMENT_FAILED', message: err.message });
  }
});

// POST /api/v1/organization/invitations — Generate expiring single-use invitation
organizationRouter.post('/invitations', inviteRateLimiter, requirePermission(PERMISSIONS.ORG_INVITATIONS_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const body = CreateInvitationInputSchema.parse(req.body);
    const db = await getDb();
    const now = new Date();
    const nowIso = now.toISOString();

    // Security check: Org admins cannot grant platform_admin
    if ((body.role as string) === 'platform_admin' && !user.roles.includes('platform_admin')) {
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

    // Record audit event (redacting the token)
    await logAuditEvent(db, {
      orgId: user.orgId!,
      actorId: user.userId,
      actorRole: user.roles[0],
      action: 'invitation.created',
      entityType: 'invitation',
      entityId: insertResult.insertedId.toString(),
      metadata: {
        email,
        role: body.role,
        branchId: body.branchId,
        expiresInDays,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

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
organizationRouter.get('/invitations', requirePermission(PERMISSIONS.ORG_INVITATIONS_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
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
organizationRouter.delete('/invitations/:id', requirePermission(PERMISSIONS.ORG_INVITATIONS_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
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

    // Record audit event
    await logAuditEvent(db, {
      orgId: user.orgId!,
      actorId: user.userId,
      actorRole: user.roles[0],
      action: 'invitation.revoked',
      entityType: 'invitation',
      entityId: id,
      metadata: { status: 'revoked' },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Invitation revoked successfully.' });
  } catch (err: any) {
    res.status(500).json({ code: 'REVOCATION_FAILED', message: err.message });
  }
});

// GET /api/v1/organization/audit-events — ADMINISTRATIVE AUDIT LOG EXPLORER (ADMIN-07)
organizationRouter.get('/audit-events', sensitiveOpsLimiter, requirePermission(PERMISSIONS.ORG_AUDIT_READ), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parsedQuery = AuditEventsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      res.status(400).json({
        code: 'INVALID_QUERY',
        message: 'Invalid audit query parameters',
        details: parsedQuery.error.format(),
      });
      return;
    }

    const { from, to, actorId, action, entityType, limit = 50, offset = 0 } = parsedQuery.data;
    const db = await getDb();

    // Strict organization scoping
    const filter: Record<string, any> = {
      orgId: user.orgId!,
    };

    if (actorId) {
      filter.actorId = actorId;
    }

    if (action) {
      filter.action = action;
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    if (from || to) {
      filter.time = {};
      if (from) {
        filter.time.$gte = from;
      }
      if (to) {
        // If 'to' is only YYYY-MM-DD, set to end of day
        filter.time.$lte = to.length === 10 ? `${to}T23:59:59.999Z` : to;
      }
    }

    const total = await db.collection('auditEvents').countDocuments(filter);

    const events = await db
      .collection('auditEvents')
      .find(filter)
      .sort({ time: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    res.json({
      events: events.map((ev) => ({
        id: ev._id ? ev._id.toString() : ev.id,
        orgId: ev.orgId,
        actorId: ev.actorId,
        actorRole: ev.actorRole,
        action: ev.action,
        entityType: ev.entityType,
        entityId: ev.entityId,
        time: ev.time || ev.timestamp,
        metadata: ev.metadata,
        ip: ev.ip,
        userAgent: ev.userAgent,
      })),
      total,
      limit,
      offset,
    });
  } catch (err: any) {
    res.status(500).json({ code: 'AUDIT_FETCH_FAILED', message: err.message });
  }
});
