import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';

export const adviceRouter = Router();

// GET /api/v1/advice
adviceRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();

    const adviceList = await db
      .collection('advice')
      .find({
        orgId: user.orgId,
        studentId: user.userId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      advice: adviceList.map((a) => ({
        id: a._id.toString(),
        authorName: a.authorName,
        authorRole: a.authorRole,
        targetType: a.targetType,
        targetId: a.targetId,
        monthKey: a.monthKey,
        body: a.body,
        isAcknowledged: !!a.isAcknowledged,
        acknowledgedAt: a.acknowledgedAt,
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

    const result = await db.collection('advice').updateOne(
      { _id: new ObjectId(id), studentId: user.userId, orgId: user.orgId },
      {
        $set: {
          isAcknowledged: true,
          acknowledgedAt: now,
          updatedAt: now,
        },
      }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Advice item not found' });
      return;
    }

    res.json({ success: true, message: 'Advice acknowledged' });
  } catch (err: any) {
    res.status(400).json({ code: 'ACKNOWLEDGE_FAILED', message: err.message });
  }
});
