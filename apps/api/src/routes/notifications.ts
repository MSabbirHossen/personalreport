import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { AuthenticatedRequest, requirePermission } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import { PERMISSIONS } from '@reportbd/shared';

export const notificationsRouter = Router();

// GET /api/v1/notifications
notificationsRouter.get('/', requirePermission(PERMISSIONS.NOTIFICATIONS_READ_OWN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);

    const query = {
      orgId: user.orgId!,
      recipientId: user.userId,
    };

    const notifications = await db
      .collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const unreadCount = await db
      .collection('notifications')
      .countDocuments({ ...query, isRead: false });

    res.json({
      notifications: notifications.map((n: any) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        targetType: n.targetType,
        targetId: n.targetId,
        actorName: n.actorName,
        isRead: Boolean(n.isRead),
        readAt: n.readAt || null,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ code: 'FETCH_FAILED', message: err.message });
  }
});

// PATCH /api/v1/notifications/:id/read
notificationsRouter.patch('/:id/read', requirePermission(PERMISSIONS.NOTIFICATIONS_WRITE_OWN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      res.status(400).json({ code: 'INVALID_ID', message: 'Malformed notification identifier.' });
      return;
    }

    const result = await db.collection('notifications').updateOne(
      {
        _id: objectId,
        orgId: user.orgId!,
        recipientId: user.userId, // Strictly scoped to authorized recipient
      },
      {
        $set: {
          isRead: true,
          readAt: now,
          updatedAt: now,
        },
      }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Notification not found.' });
      return;
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err: any) {
    res.status(500).json({ code: 'UPDATE_FAILED', message: err.message });
  }
});

// POST /api/v1/notifications/read-all
notificationsRouter.post('/read-all', requirePermission(PERMISSIONS.NOTIFICATIONS_WRITE_OWN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();
    const now = new Date().toISOString();

    const result = await db.collection('notifications').updateMany(
      {
        orgId: user.orgId!,
        recipientId: user.userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: now,
          updatedAt: now,
        },
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.',
      updatedCount: result.modifiedCount,
    });
  } catch (err: any) {
    res.status(500).json({ code: 'UPDATE_FAILED', message: err.message });
  }
});
