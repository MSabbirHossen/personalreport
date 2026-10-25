import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { logAuditEvent } from '../services/audit.js';

describe('Real MongoDB Integration Verification (Stage 3)', () => {
  const mongoUri =
    process.env.TEST_MONGODB_URI ||
    'mongodb://127.0.0.1:27017/reportbd_test_phase5?directConnection=true';
  const testDbName = 'reportbd_test_phase5';
  let client: MongoClient;
  let db: Db;
  let isMongoAvailable = false;

  before(async () => {
    try {
      client = new MongoClient(mongoUri, {
        directConnection: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await client.connect();
      db = client.db(testDbName);
      await db.command({ ping: 1 });
      isMongoAvailable = true;
      // Clean slate for testing
      await db.dropDatabase();
    } catch (err: any) {
      console.warn('⚠️ Real MongoDB not accessible on', mongoUri, err.message);
      isMongoAvailable = false;
    }
  });

  after(async () => {
    if (client && isMongoAvailable) {
      try {
        await db.dropDatabase();
      } catch {
        // Ignored
      }
      await client.close();
    }
  });

  const shouldFailIfUnavailable =
    process.env.CI === 'true' || process.env.FAIL_ON_UNAVAILABLE_MONGO === 'true';

  function ensureMongoAvailable(t: any): boolean {
    if (!isMongoAvailable) {
      if (shouldFailIfUnavailable) {
        assert.fail(
          `CRITICAL: Real MongoDB instance required but not accessible at ${mongoUri}. In CI/enforced mode, integration tests cannot be skipped.`
        );
      }
      t.skip(
        `Skipped: Real MongoDB instance not reachable at ${mongoUri} (set FAIL_ON_UNAVAILABLE_MONGO=true to enforce).`
      );
      return false;
    }
    return true;
  }

  test('RealMongo-1: Database index initialization is idempotent on real MongoDB engine', async (t) => {
    if (!ensureMongoAvailable(t)) return;

    // 1. Create indexes matching initDb.ts
    await db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true });
    await db.collection('memberships').createIndex({ orgId: 1, userId: 1 }, { unique: true });
    await db.collection('dailyReports').createIndex(
      { orgId: 1, studentId: 1, dateKey: 1 },
      { unique: true }
    );
    await db.collection('monthlyPlans').createIndex(
      { orgId: 1, studentId: 1, monthKey: 1 },
      { unique: true }
    );
    await db.collection('monthlyOutcomes').createIndex(
      { orgId: 1, studentId: 1, monthKey: 1 },
      { unique: true }
    );
    await db.collection('notifications').createIndex(
      { orgId: 1, recipientId: 1, idempotencyKey: 1 },
      { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
    );
    await db.collection('auditEvents').createIndex({ orgId: 1, time: -1 });
    await db.collection('auditEvents').createIndex({ orgId: 1, action: 1, time: -1 });

    // 2. Rerun all index creation to verify idempotency (no conflicts or throws)
    await db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true });
    await db.collection('notifications').createIndex(
      { orgId: 1, recipientId: 1, idempotencyKey: 1 },
      { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
    );
    await db.collection('auditEvents').createIndex({ orgId: 1, time: -1 });

    const auditIndexes = await db.collection('auditEvents').indexes();
    const notifIndexes = await db.collection('notifications').indexes();

    assert.ok(auditIndexes.some((idx) => idx.name === 'orgId_1_time_-1'));
    assert.ok(notifIndexes.some((idx) => idx.name === 'orgId_1_recipientId_1_idempotencyKey_1'));
  });

  test('RealMongo-2: Notification sparse unique index enforces idempotency and drops duplicates on real MongoDB engine', async (t) => {
    if (!ensureMongoAvailable(t)) return;

    const orgId = 'org_real_test';
    const recipientId = 'student_real_1';
    const idempotencyKey = 'unique_outcome_submit_2026-10_rev1';

    // First insert succeeds
    const insertRes1 = await db.collection('notifications').insertOne({
      orgId,
      recipientId,
      idempotencyKey,
      title: 'রিপোর্ট জমা হয়েছে',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    assert.ok(insertRes1.insertedId);

    // Second insert with SAME (orgId, recipientId, idempotencyKey) MUST fail with E11000 duplicate key error
    await assert.rejects(
      async () => {
        await db.collection('notifications').insertOne({
          orgId,
          recipientId,
          idempotencyKey,
          title: 'ডুপ্লিকেট রিপোর্ট জমা',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      },
      (err: any) => {
        assert.equal(err.code, 11000);
        return true;
      }
    );

    // Multiple notifications with idempotencyKey: undefined/null MUST succeed due to sparse indexing
    const sparse1 = await db.collection('notifications').insertOne({
      orgId,
      recipientId,
      title: 'সাধারণ সিস্টেম নোটিশ ১',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    const sparse2 = await db.collection('notifications').insertOne({
      orgId,
      recipientId,
      title: 'সাধারণ সিস্টেম নোটিশ ২',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    assert.ok(sparse1.insertedId);
    assert.ok(sparse2.insertedId);
  });

  test('RealMongo-3: Concurrent atomic conditional updates prevent race conditions on real MongoDB engine', async (t) => {
    if (!ensureMongoAvailable(t)) return;

    const orgId = 'org_real_concurrency';
    const outcomeId = new ObjectId();

    // Insert submitted outcome
    await db.collection('monthlyOutcomes').insertOne({
      _id: outcomeId,
      orgId,
      studentId: 'student_conc_1',
      monthKey: '2026-10',
      status: 'submitted',
      revision: 1,
      createdAt: new Date().toISOString(),
    });

    // Execute TWO concurrent review actions simultaneously
    const supervisorA = db.collection('monthlyOutcomes').updateOne(
      {
        _id: outcomeId,
        orgId,
        status: { $in: ['submitted', 'in_review'] },
      },
      {
        $set: {
          status: 'acknowledged',
          reviewedBy: 'supervisor_a',
          reviewedAt: new Date().toISOString(),
        },
        $inc: { revision: 1 },
      }
    );

    const supervisorB = db.collection('monthlyOutcomes').updateOne(
      {
        _id: outcomeId,
        orgId,
        status: { $in: ['submitted', 'in_review'] },
      },
      {
        $set: {
          status: 'returned',
          reviewedBy: 'supervisor_b',
          reviewedAt: new Date().toISOString(),
        },
        $inc: { revision: 1 },
      }
    );

    const [resA, resB] = await Promise.all([supervisorA, supervisorB]);

    // Real MongoDB guarantee: Exactly ONE update matches and modifies the document
    const matchedCountSum = resA.matchedCount + resB.matchedCount;
    const modifiedCountSum = resA.modifiedCount + resB.modifiedCount;

    assert.equal(matchedCountSum, 1, 'Only one concurrent review update should match reviewable status');
    assert.equal(modifiedCountSum, 1, 'Only one concurrent review update should modify the document');

    // Verify document in database
    const finalDoc = await db.collection('monthlyOutcomes').findOne({ _id: outcomeId });
    assert.ok(finalDoc);
    assert.ok(['acknowledged', 'returned'].includes(finalDoc.status));
    assert.equal(finalDoc.revision, 2, 'Revision must be incremented exactly once (from 1 to 2)');
  });

  test('RealMongo-4: Audit log insertion and organization isolation on real MongoDB engine', async (t) => {
    if (!ensureMongoAvailable(t)) return;

    const orgA = 'org_alpha';
    const orgB = 'org_beta';

    // Log events for orgA
    await logAuditEvent(db, {
      orgId: orgA,
      actorId: 'admin_a',
      actorRole: 'org_admin',
      action: 'invitation.created',
      entityType: 'invitation',
      entityId: 'inv_a1',
      metadata: { email: 'student_a@test.com', token: 'SUPER_SECRET_TOKEN' }, // token must be redacted
    });

    await logAuditEvent(db, {
      orgId: orgA,
      actorId: 'supervisor_a',
      actorRole: 'supervisor',
      action: 'review.acknowledged',
      entityType: 'monthlyOutcome',
      entityId: 'outcome_a1',
      metadata: { status: 'acknowledged' },
    });

    // Log event for orgB
    await logAuditEvent(db, {
      orgId: orgB,
      actorId: 'admin_b',
      actorRole: 'org_admin',
      action: 'invitation.created',
      entityType: 'invitation',
      entityId: 'inv_b1',
      metadata: { email: 'student_b@test.com' },
    });

    // Query orgA events
    const orgAEvents = await db
      .collection('auditEvents')
      .find({ orgId: orgA })
      .sort({ time: -1 })
      .toArray();

    assert.equal(orgAEvents.length, 2);
    for (const ev of orgAEvents) {
      assert.equal(ev.orgId, orgA);
      assert.notEqual(ev.orgId, orgB);
    }

    // Verify token redaction in metadata
    const invAEvent = orgAEvents.find((e) => e.entityId === 'inv_a1');
    assert.ok(invAEvent);
    assert.equal(invAEvent.metadata?.token, '[REDACTED]', 'Sensitive token must be redacted in audit metadata');
    assert.equal(invAEvent.metadata?.email, 'student_a@test.com');
  });
});
