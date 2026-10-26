import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { logAuditEvent } from '../services/audit.js';

// Strict allowlist of approved test database names: prevents accidental target of dev or prod DBs
export const ALLOWED_TEST_DB_NAMES = new Set([
  'reportbd_test',
  'reportbd_test_ci',
  'reportbd_test_phase5',
  'reportbd_test_phase6',
  'reportbd_test_phase7',
  'reportbd_test_phase8',
  'reportbd_test_phase9',
  'reportbd_integration_test',
]);

export function sanitizeMongoUri(uri: string): string {
  try {
    const url = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://'));
    if (url.username || url.password) {
      return uri.replace(/\/\/[^@]+@/, '//***:***@');
    }
    return uri;
  } catch {
    return 'mongodb://[REDACTED_URI]';
  }
}

export function extractDatabaseName(uri: string, fallback: string): string {
  try {
    const url = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://'));
    const pathname = url.pathname.replace(/^\//, '').split('?')[0];
    return pathname || fallback;
  } catch {
    return fallback;
  }
}

export function assertSafeIntegrationTarget(
  uri: string,
  dbName: string,
  nodeEnv: string = process.env.NODE_ENV || 'test'
): void {
  // 1. Reject production environment
  if (nodeEnv === 'production') {
    throw new Error(
      'Refusing to execute destructive MongoDB integration tests in production environment (NODE_ENV=production).'
    );
  }

  // 2. Reject missing, empty, or non-string URI
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    throw new Error('Refusing to execute: MongoDB connection URI is missing, empty, or invalid.');
  }

  // 3. Reject unsupported URI schemes
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('Refusing to execute: Invalid MongoDB URI scheme. Must start with mongodb://.');
  }

  // 4. Reject unapproved database names (strict allowlist)
  if (!dbName || !ALLOWED_TEST_DB_NAMES.has(dbName)) {
    throw new Error(
      `Refusing to drop or operate on unapproved database: "${dbName}". Only explicit test databases (${Array.from(ALLOWED_TEST_DB_NAMES).join(', ')}) are permitted.`
    );
  }

  // 5. Reject unapproved remote hosts/clusters or embedded unapproved database paths
  try {
    const isSrv = uri.startsWith('mongodb+srv://');
    if (isSrv) {
      throw new Error(
        'Refusing to connect integration test harness to remote SRV cluster (mongodb+srv://). Integration tests only permit local/CI instances.'
      );
    }

    const parsed = new URL(uri.replace(/^mongodb:\/\//, 'http://'));
    const hostname = parsed.hostname.toLowerCase();
    const isApprovedHost =
      hostname === '127.0.0.1' ||
      hostname === 'localhost' ||
      hostname === 'mongo';

    if (!isApprovedHost) {
      throw new Error(
        `Refusing to connect integration test harness to remote or unapproved MongoDB host: "${hostname}". Integration tests only permit local/CI instances (127.0.0.1, localhost, mongo).`
      );
    }

    // Verify embedded pathname database if present
    const embeddedDb = parsed.pathname.replace(/^\//, '').split('?')[0];
    if (embeddedDb && !ALLOWED_TEST_DB_NAMES.has(embeddedDb)) {
      throw new Error(
        `Refusing to connect: URI embedded database "${embeddedDb}" does not match approved test databases.`
      );
    }
  } catch (err: any) {
    if (err.message.includes('Refusing')) throw err;
    throw new Error(`Failed to safely parse MongoDB URI for target validation: ${err.message}`);
  }
}


describe('Real MongoDB Integration Verification (Stage 3)', () => {
  const mongoUri =
    process.env.TEST_MONGODB_URI ||
    'mongodb://127.0.0.1:27017/reportbd_test_phase9?directConnection=true';
  const testDbName = process.env.TEST_DB_NAME || extractDatabaseName(mongoUri, 'reportbd_test_phase9');
  let client: MongoClient;
  let db: Db;
  let isMongoAvailable = false;

  const shouldFailIfUnavailable =
    process.env.CI === 'true' || process.env.FAIL_ON_UNAVAILABLE_MONGO === 'true';

  before(async () => {
    try {
      // Safety guard: Strict target validation to protect production and remote databases
      assertSafeIntegrationTarget(mongoUri, testDbName);

      client = new MongoClient(mongoUri, {
        directConnection: true,
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      });
      await client.connect();
      db = client.db(testDbName);
      await db.command({ ping: 1 });
      isMongoAvailable = true;

      // Verify connected database name strictly matches allowlist before destructive drop
      if (!ALLOWED_TEST_DB_NAMES.has(db.databaseName)) {
        throw new Error(`Connected database "${db.databaseName}" does not match test allowlist.`);
      }
      // Clean slate for testing
      await db.dropDatabase();
    } catch (err: any) {
      console.warn('⚠️ Real MongoDB not accessible on', sanitizeMongoUri(mongoUri), err.message);
      isMongoAvailable = false;
      if (shouldFailIfUnavailable) {
        throw new Error(
          `CRITICAL: Real MongoDB instance required but failed to connect or initialize: ${err.message}`
        );
      }
    }
  });

  after(async () => {
    if (client && isMongoAvailable) {
      try {
        if (ALLOWED_TEST_DB_NAMES.has(db?.databaseName)) {
          await db.dropDatabase();
        }
      } catch {
        // Ignored
      }
      await client.close();
    }
  });

  function ensureMongoAvailable(t: any): boolean {
    if (!isMongoAvailable) {
      if (shouldFailIfUnavailable) {
        assert.fail(
          `CRITICAL: Real MongoDB instance required but not accessible at ${sanitizeMongoUri(mongoUri)}. In CI/enforced mode, integration tests cannot be skipped.`
        );
      }
      t.skip(
        `Skipped: Real MongoDB instance not reachable at ${sanitizeMongoUri(mongoUri)} (set FAIL_ON_UNAVAILABLE_MONGO=true to enforce).`
      );
      return false;
    }
    return true;
  }

  test('RealMongo-0: Target validation safety guard rejects production mode, remote hosts, and unapproved DBs', () => {
    // 1. Rejects production environment
    assert.throws(
      () => assertSafeIntegrationTarget('mongodb://127.0.0.1:27017/reportbd_test', 'reportbd_test', 'production'),
      /NODE_ENV=production/
    );

    // 2. Rejects unapproved database name (e.g. production database)
    assert.throws(
      () => assertSafeIntegrationTarget('mongodb://127.0.0.1:27017/reportbd', 'reportbd', 'test'),
      /Refusing to drop or operate on unapproved database/
    );

    // 3. Rejects substring match trickery like 'production_test_backup'
    assert.throws(
      () => assertSafeIntegrationTarget('mongodb://127.0.0.1:27017/production_test_backup', 'production_test_backup', 'test'),
      /Refusing to drop or operate on unapproved database/
    );

    // 4. Rejects remote Atlas SRV URI
    assert.throws(
      () => assertSafeIntegrationTarget('mongodb+srv://admin:pass@cluster0.mongodb.net/reportbd_test', 'reportbd_test', 'test'),
      /remote SRV cluster/
    );


    // 5. Rejects remote host/IP
    assert.throws(
      () => assertSafeIntegrationTarget('mongodb://192.168.1.100:27017/reportbd_test', 'reportbd_test', 'test'),
      /remote or unapproved MongoDB host/
    );

    // 6. Sanitizes credential-bearing URI in logging
    const sanitized = sanitizeMongoUri('mongodb://user:supersecretpass@127.0.0.1:27017/reportbd_test');
    assert.ok(!sanitized.includes('supersecretpass'));
    assert.ok(sanitized.includes('***:***'));

    // 7. Rejects missing, empty, or whitespace URI
    assert.throws(
      () => assertSafeIntegrationTarget('', 'reportbd_test', 'test'),
      /MongoDB connection URI is missing, empty, or invalid/
    );

    // 8. Rejects non-mongo URI schemes
    assert.throws(
      () => assertSafeIntegrationTarget('http://127.0.0.1:27017/reportbd_test', 'reportbd_test', 'test'),
      /Invalid MongoDB URI scheme/
    );

    // 9. Rejects missing or empty dbName
    assert.throws(
      () => assertSafeIntegrationTarget('mongodb://127.0.0.1:27017/reportbd_test', '', 'test'),
      /Refusing to drop or operate on unapproved database/
    );

    // 10. Rejects URI with embedded unapproved database name
    assert.throws(
      () => assertSafeIntegrationTarget('mongodb://127.0.0.1:27017/production_cluster', 'reportbd_test', 'test'),
      /URI embedded database "production_cluster" does not match approved test databases/
    );

    // 11. Permits valid local and CI targets
    assert.doesNotThrow(() =>
      assertSafeIntegrationTarget('mongodb://127.0.0.1:27017/reportbd_test_phase9', 'reportbd_test_phase9', 'test')
    );
    assert.doesNotThrow(() =>
      assertSafeIntegrationTarget('mongodb://mongo:27017/reportbd_test_ci', 'reportbd_test_ci', 'test')
    );
    assert.doesNotThrow(() =>
      assertSafeIntegrationTarget('mongodb://localhost:27017/reportbd_test', 'reportbd_test', 'test')
    );
  });


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
