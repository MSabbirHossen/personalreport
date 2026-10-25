import { ObjectId } from 'mongodb';
import { InAppNotification, NotificationType } from '@reportbd/shared';

export interface CreateNotificationParams {
  orgId: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  targetType: 'outcome' | 'plan' | 'advice';
  targetId: string;
  idempotencyKey?: string;
}

/**
 * Idempotently creates an in-app notification for a user.
 * Duplicate requests matching (orgId, recipientId, idempotencyKey) return existing notification.
 */
export async function createInAppNotification(
  db: any,
  params: CreateNotificationParams
): Promise<{ id: string; isDuplicate: boolean }> {
  const collection = db.collection('notifications');

  // Check idempotency key if provided
  if (params.idempotencyKey) {
    const existing = await collection.findOne({
      orgId: params.orgId,
      recipientId: params.recipientId,
      idempotencyKey: params.idempotencyKey,
    });

    if (existing) {
      return { id: existing._id ? existing._id.toString() : existing.id, isDuplicate: true };
    }
  }

  const now = new Date().toISOString();
  const doc = {
    orgId: params.orgId,
    recipientId: params.recipientId,
    actorId: params.actorId,
    actorName: params.actorName,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    targetType: params.targetType,
    targetId: params.targetId,
    idempotencyKey: params.idempotencyKey,
    isRead: false,
    createdAt: now,
  };

  try {
    const result = await collection.insertOne(doc);
    return { id: result.insertedId.toString(), isDuplicate: false };
  } catch (err: any) {
    // If unique index on idempotencyKey tripped concurrently
    if (err.code === 11000 && params.idempotencyKey) {
      const existing = await collection.findOne({
        orgId: params.orgId,
        recipientId: params.recipientId,
        idempotencyKey: params.idempotencyKey,
      });
      if (existing) {
        return { id: existing._id ? existing._id.toString() : existing.id, isDuplicate: true };
      }
    }
    throw err;
  }
}
