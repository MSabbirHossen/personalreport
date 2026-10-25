import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import { logAuditEvent } from '../services/audit.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

export const invitationsRouter = Router();

// GET /api/v1/invitations/:token — Preview invitation details
invitationsRouter.get('/:token', async (req, res: Response) => {
  try {
    const token = req.params.token as string;
    if (!token || token.length < 16) {
      res.status(400).json({ code: 'INVALID_TOKEN', message: 'Malformed invitation token.' });
      return;
    }

    const db = await getDb();
    const invitation = await db.collection('invitations').findOne({ token });

    if (!invitation) {
      res.status(404).json({ code: 'INVITATION_NOT_FOUND', message: 'Invitation not found or link is invalid.' });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);

    if (invitation.status !== 'pending' || expiresAt <= now) {
      // If past expiry date and still marked pending, lazily transition status
      if (invitation.status === 'pending' && expiresAt <= now) {
        await db.collection('invitations').updateOne(
          { _id: invitation._id },
          { $set: { status: 'expired', updatedAt: now.toISOString() } }
        );
      }
      res.status(410).json({
        code: 'INVITATION_EXPIRED',
        message: 'This invitation has expired or has already been accepted.',
        status: invitation.status === 'pending' ? 'expired' : invitation.status,
      });
      return;
    }

    // Lookup organization name and details
    const org = await db.collection('organizations').findOne({
      $or: [{ id: invitation.orgId }, { slug: invitation.orgId }],
    });

    res.json({
      valid: true,
      invitation: {
        id: invitation._id.toString(),
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
      organization: {
        id: invitation.orgId,
        nameBn: org?.nameBn || 'শাখা',
        nameEn: org?.nameEn || 'Organization',
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// POST /api/v1/invitations/:token/accept — Accept invitation (Requires authentication)
invitationsRouter.post('/:token/accept', authRateLimiter, requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = req.params.token as string;
    const user = req.user!;
    const db = await getDb();
    const now = new Date();
    const nowIso = now.toISOString();

    const invitation = await db.collection('invitations').findOne({ token });

    if (!invitation) {
      res.status(404).json({ code: 'INVITATION_NOT_FOUND', message: 'Invitation not found or link is invalid.' });
      return;
    }

    const expiresAt = new Date(invitation.expiresAt);

    if (invitation.status !== 'pending' || expiresAt <= now) {
      res.status(410).json({
        code: 'INVITATION_EXPIRED',
        message: 'This invitation is no longer active.',
        status: invitation.status === 'pending' ? 'expired' : invitation.status,
      });
      return;
    }

    // Prevent privilege escalation: only allow designated roles
    const assignedRole = invitation.role;
    if (assignedRole === 'platform_admin') {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Platform admin roles cannot be granted via standard invitation.' });
      return;
    }

    // Create or update active membership
    const membershipDoc = {
      orgId: invitation.orgId,
      userId: user.userId,
      roles: [assignedRole],
      branchId: invitation.branchId || undefined,
      membershipLevelId: invitation.membershipLevelId || undefined,
      status: 'active',
      joinedAt: nowIso,
      updatedAt: nowIso,
    };

    await db.collection('memberships').updateOne(
      { orgId: invitation.orgId, userId: user.userId },
      {
        $set: membershipDoc,
        $setOnInsert: { createdAt: nowIso },
      },
      { upsert: true }
    );

    // Mark invitation as accepted
    await db.collection('invitations').updateOne(
      { _id: invitation._id },
      {
        $set: {
          status: 'accepted',
          acceptedAt: nowIso,
          acceptedBy: user.userId,
          updatedAt: nowIso,
        },
      }
    );

    // Record audit event
    await logAuditEvent(db, {
      orgId: invitation.orgId,
      actorId: user.userId,
      actorRole: assignedRole,
      action: 'invitation.accepted',
      entityType: 'invitation',
      entityId: invitation._id.toString(),
      metadata: {
        role: assignedRole,
        branchId: invitation.branchId,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Invitation accepted successfully. You now have active membership.',
      membership: membershipDoc,
    });
  } catch (err: any) {
    res.status(500).json({ code: 'ACCEPT_FAILED', message: err.message });
  }
});
