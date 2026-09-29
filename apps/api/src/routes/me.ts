import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getDb } from '../db/mongo.js';
import { UpdateProfileInputSchema } from '@reportbd/shared';

export const meRouter = Router();

// GET /api/v1/me
meRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();
    const userRecord = await db.collection('users').findOne({ _id: new ObjectId(user.userId) });
    
    if (!userRecord) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'User profile not found' });
      return;
    }

    res.json({
      user: {
        id: userRecord._id.toString(),
        firebaseUid: userRecord.firebaseUid,
        email: userRecord.email,
        name: userRecord.name,
        photoUrl: userRecord.photoUrl,
        status: userRecord.status,
        profile: userRecord.profile || {},
        roles: user.roles,
        orgId: user.orgId,
      },
    });
  } catch (err) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Failed to fetch user profile' });
  }
});

// PATCH /api/v1/me
meRouter.patch('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const payload = UpdateProfileInputSchema.parse(req.body);
    const db = await getDb();

    const updateDoc: Record<string, any> = {
      name: payload.name,
      updatedAt: new Date().toISOString(),
    };
    if (payload.photoUrl !== undefined) updateDoc.photoUrl = payload.photoUrl;
    if (payload.profile !== undefined) updateDoc.profile = payload.profile;

    await db.collection('users').updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: updateDoc }
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err: any) {
    res.status(400).json({ code: 'UPDATE_FAILED', message: err.message });
  }
});
