import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { app } from '../app.js';
import { config } from '../config/index.js';
import { setCustomTokenVerifier } from '../middleware/auth.js';
import { setTestDb } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

// In-memory collection stub
class MockCollection {
  private docs: any[] = [];

  constructor(initialDocs: any[] = []) {
    this.docs = JSON.parse(JSON.stringify(initialDocs));
  }

  async findOne(query: any = {}): Promise<any | null> {
    const found = this.docs.find((d) => this.matchQuery(d, query));
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  find(query: any = {}) {
    const results = this.docs.filter((d) => this.matchQuery(d, query));
    return {
      toArray: async () => JSON.parse(JSON.stringify(results)),
      sort: () => ({
        toArray: async () => JSON.parse(JSON.stringify(results)),
      }),
    };
  }

  async insertOne(doc: any): Promise<{ insertedId: ObjectId }> {
    const insertedId = doc._id || new ObjectId();
    const newDoc = { ...doc, _id: insertedId };
    this.docs.push(newDoc);
    return { insertedId };
  }

  async updateOne(query: any, update: any, options: any = {}): Promise<any> {
    const index = this.docs.findIndex((d) => this.matchQuery(d, query));
    if (index >= 0) {
      if (update.$set) {
        this.docs[index] = { ...this.docs[index], ...update.$set };
      }
      return { matchedCount: 1, modifiedCount: 1 };
    }
    if (options.upsert) {
      const newDoc = {
        ...query,
        ...(update.$set || {}),
        ...(update.$setOnInsert || {}),
        _id: new ObjectId(),
      };
      this.docs.push(newDoc);
      return { matchedCount: 0, upsertedCount: 1 };
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }

  async createIndex(): Promise<string> {
    return 'mock_index';
  }

  private matchQuery(doc: any, query: any): boolean {
    for (const key of Object.keys(query)) {
      if (key === '_id') {
        const queryId = query._id?.toString();
        const docId = doc._id?.toString();
        if (queryId !== docId) return false;
        continue;
      }
      if (typeof query[key] === 'object' && query[key] !== null) {
        if (query[key].$in && Array.isArray(query[key].$in)) {
          const docVal = doc[key]?.toString();
          const inList = query[key].$in.map((v: any) => v?.toString());
          if (!inList.includes(docVal)) return false;
          continue;
        }
        if (query[key].$regex) {
          const regex = new RegExp(query[key].$regex);
          if (!regex.test(doc[key])) return false;
          continue;
        }
      }
      if (doc[key] !== query[key]) {
        return false;
      }
    }
    return true;
  }
}

// In-memory Database Stub
class MockDb {
  public collections: Record<string, MockCollection> = {};

  collection(name: string): any {
    if (!this.collections[name]) {
      this.collections[name] = new MockCollection();
    }
    return this.collections[name];
  }

  async command(cmd: any): Promise<any> {
    if (cmd.ping) return { ok: 1 };
    return {};
  }
}

describe('Authentication, Authorization & Security Quality Gates', () => {
  let server: Server;
  let baseUrl: string;
  let mockDb: MockDb;

  before(async () => {
    // Start Express on an ephemeral random OS port
    server = app.listen(0);
    const address = server.address() as any;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    if (server) {
      server.close();
    }
    setTestDb(null);
    setCustomTokenVerifier(null);
  });

  beforeEach(() => {
    mockDb = new MockDb();
    setTestDb(mockDb as any);

    // Default token verifier: resolves 'token-student-1' to student_1
    setCustomTokenVerifier(async (token: string) => {
      if (token === 'token-student-1') {
        return { uid: 'uid_student_1', email: 'student1@reportbd.org', name: 'Student One' };
      }
      if (token === 'token-student-2') {
        return { uid: 'uid_student_2', email: 'student2@reportbd.org', name: 'Student Two' };
      }
      if (token === 'token-supervisor-1') {
        return { uid: 'uid_sup_1', email: 'sup1@reportbd.org', name: 'Supervisor One' };
      }
      if (token === 'token-supervisor-2') {
        return { uid: 'uid_sup_2', email: 'sup2@reportbd.org', name: 'Supervisor Two' };
      }
      if (token === 'token-no-membership') {
        return { uid: 'uid_unassigned', email: 'unassigned@reportbd.org', name: 'New User' };
      }
      if (token === 'token-suspended') {
        return { uid: 'uid_suspended', email: 'suspended@reportbd.org', name: 'Suspended User' };
      }
      if (token === 'token-org-b') {
        return { uid: 'uid_org_b_user', email: 'user@orgb.org', name: 'Org B User' };
      }
      throw new Error('Firebase ID token has expired or is invalid');
    });
  });

  // Test 1: Missing, malformed, expired, and invalid tokens are rejected
  test('Gate 1: Missing, malformed, expired, and invalid tokens are rejected with 401', async () => {
    // A. Missing token
    const resNoAuth = await fetch(`${baseUrl}/api/v1/me`);
    assert.equal(resNoAuth.status, 401);
    const jsonNoAuth = await resNoAuth.json();
    assert.equal(jsonNoAuth.code, 'UNAUTHORIZED');

    // B. Malformed Authorization header
    const resMalformed = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    assert.equal(resMalformed.status, 401);

    // C. Expired / Invalid token
    const resInvalid = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Authorization: 'Bearer invalid-or-expired-token' },
    });
    assert.equal(resInvalid.status, 401);
    const jsonInvalid = await resInvalid.json();
    assert.equal(jsonInvalid.code, 'INVALID_TOKEN');
  });

  // Test 2: mock-token cannot authenticate in production
  test('Gate 2: mock-token cannot authenticate in production or when allowDevMockAuth is false', async () => {
    // When allowDevMockAuth is disabled (as required in production)
    config.allowDevMockAuth = false;

    // Temporarily bypass custom verifier so requireAuth tests the mock-token branch
    setCustomTokenVerifier(null);

    const res = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Authorization: 'Bearer mock-token' },
    });
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.code, 'MOCK_AUTH_DISABLED');
  });

  // Test 3: Valid Firebase identity without active membership cannot access organization resources
  test('Gate 3: Identity without active membership cannot access protected organization endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/v1/daily-reports?month=2026-09`, {
      headers: { Authorization: 'Bearer token-no-membership' },
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.code, 'NO_ACTIVE_MEMBERSHIP');
  });

  // Test 4: Suspended accounts are denied access
  test('Gate 4: Suspended or deactivated accounts are denied access with 403', async () => {
    // Seed user with suspended status
    const suspendedId = new ObjectId();
    await mockDb.collection('users').insertOne({
      _id: suspendedId,
      firebaseUid: 'uid_suspended',
      email: 'suspended@reportbd.org',
      name: 'Suspended User',
      status: 'suspended',
    });

    const res = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Authorization: 'Bearer token-suspended' },
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.code, 'ACCOUNT_SUSPENDED');
  });

  // Test 5: Cross-student resource isolation
  test('Gate 5: A student cannot read or overwrite another student daily report', async () => {
    // Seed student 1 and student 2 in Org A
    const s1Id = new ObjectId();
    const s2Id = new ObjectId();

    await mockDb.collection('users').insertOne({
      _id: s1Id,
      firebaseUid: 'uid_student_1',
      name: 'Student One',
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      userId: s1Id.toString(),
      orgId: 'org_alpha',
      roles: ['student'],
      status: 'active',
    });

    await mockDb.collection('users').insertOne({
      _id: s2Id,
      firebaseUid: 'uid_student_2',
      name: 'Student Two',
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      userId: s2Id.toString(),
      orgId: 'org_alpha',
      roles: ['student'],
      status: 'active',
    });

    // Student 1 writes a report for 2026-09-15
    const saveRes = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-15`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer token-student-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateKey: '2026-09-15',
        values: { quran_study_ayah: 15 },
      }),
    });
    assert.equal(saveRes.status, 200);

    // Student 2 queries 2026-09-15
    const s2Get = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-15`, {
      headers: { Authorization: 'Bearer token-student-2' },
    });
    assert.equal(s2Get.status, 200);
    const s2Data = await s2Get.json();
    // Student 2 must see empty status for their own record, not Student 1's values
    assert.equal(s2Data.status, 'empty');
    assert.deepEqual(s2Data.values, {});
  });

  // Test 6: Cross-organization tenant isolation
  test('Gate 6: User in Organization A cannot access Organization B data', async () => {
    // Student in Org Alpha
    const s1Id = new ObjectId();
    await mockDb.collection('users').insertOne({
      _id: s1Id,
      firebaseUid: 'uid_student_1',
      name: 'Student One',
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      userId: s1Id.toString(),
      orgId: 'org_alpha',
      roles: ['student'],
      status: 'active',
    });

    // User in Org Beta
    const bId = new ObjectId();
    await mockDb.collection('users').insertOne({
      _id: bId,
      firebaseUid: 'uid_org_b_user',
      name: 'Org B Student',
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      userId: bId.toString(),
      orgId: 'org_beta',
      roles: ['student'],
      status: 'active',
    });

    // Insert report in Org Beta
    await mockDb.collection('dailyReports').insertOne({
      orgId: 'org_beta',
      studentId: bId.toString(),
      dateKey: '2026-09-10',
      values: { quran_study_ayah: 50 },
      status: 'saved',
    });

    // Student in Org Alpha queries 2026-09-10
    const res = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-10`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    const data = await res.json();
    // Org Alpha student cannot view Org Beta report
    assert.equal(data.status, 'empty');
  });

  // Test 7: Supervisor cannot review an unassigned student
  test('Gate 7: Supervisor cannot review or alter reports of an unassigned student', async () => {
    const sup1Id = new ObjectId();
    const sup2Id = new ObjectId();
    const studentId = new ObjectId();
    const outcomeId = new ObjectId();

    // Supervisor 1 (assigned)
    await mockDb.collection('users').insertOne({
      _id: sup1Id,
      firebaseUid: 'uid_sup_1',
      name: 'Supervisor One',
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      userId: sup1Id.toString(),
      orgId: 'org_alpha',
      roles: ['supervisor'],
      status: 'active',
    });

    // Supervisor 2 (NOT assigned)
    await mockDb.collection('users').insertOne({
      _id: sup2Id,
      firebaseUid: 'uid_sup_2',
      name: 'Supervisor Two',
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      userId: sup2Id.toString(),
      orgId: 'org_alpha',
      roles: ['supervisor'],
      status: 'active',
    });

    // Assignment only links Supervisor 1 to Student
    await mockDb.collection('supervisorAssignments').insertOne({
      orgId: 'org_alpha',
      supervisorId: sup1Id.toString(),
      studentId: studentId.toString(),
      status: 'active',
    });

    // Student outcome record
    await mockDb.collection('monthlyOutcomes').insertOne({
      _id: outcomeId,
      orgId: 'org_alpha',
      studentId: studentId.toString(),
      monthKey: '2026-09',
      status: 'submitted',
    });

    // Supervisor 2 attempts review
    const unassignedReviewRes = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${outcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-2',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: outcomeId.toString(),
        action: 'acknowledge',
        feedback: 'Unauthorized review attempt',
      }),
    });

    assert.equal(unassignedReviewRes.status, 403);
    const json = await unassignedReviewRes.json();
    assert.equal(json.code, 'FORBIDDEN');
    assert.match(json.message, /not assigned to review/i);

    // Supervisor 1 (assigned) performs review -> succeeds
    const assignedReviewRes = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${outcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: outcomeId.toString(),
        action: 'acknowledge',
        feedback: 'Well done, approved!',
      }),
    });
    assert.equal(assignedReviewRes.status, 200);
  });

  // Test 8: Database failures are not misreported as authentication failures
  test('Gate 8: Database failure produces 503 DATABASE_UNAVAILABLE, not 401 INVALID_TOKEN', async () => {
    // Inject a failing DB stub that simulates MongoDB outage
    const failingDb = {
      collection: () => {
        throw new Error('MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017');
      },
    };
    setTestDb(failingDb as any);

    const res = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(res.status, 503);
    const json = await res.json();
    assert.equal(json.code, 'DATABASE_UNAVAILABLE');
    assert.notEqual(json.code, 'INVALID_TOKEN');
  });

  // Test 9: Valid authenticated user with active membership can complete an authorized request
  test('Gate 9: Authorized user with active membership receives 200 with data', async () => {
    const studentId = new ObjectId();
    await mockDb.collection('users').insertOne({
      _id: studentId,
      firebaseUid: 'uid_student_1',
      name: 'Student One',
      email: 'student1@reportbd.org',
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      userId: studentId.toString(),
      orgId: 'org_alpha',
      roles: ['student'],
      status: 'active',
    });

    const res = await fetch(`${baseUrl}/api/v1/templates/current`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.template);
    assert.equal(json.template.id, 'default_v1');
  });

  // Test 10: CORS policy in production rejects unapproved origins
  test('Gate 10: Production CORS policy rejects unapproved origins', async () => {
    config.isProduction = true;
    config.cors.allowedOrigins = ['https://reportbd.org'];

    // Request with unapproved origin
    const res = await fetch(`${baseUrl}/health`, {
      headers: {
        Origin: 'https://evil-attacker.com',
      },
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.code, 'CORS_FORBIDDEN');

    // Reset config
    config.isProduction = false;
  });
});
