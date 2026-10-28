import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { app } from '../app.js';
import { setCustomTokenVerifier } from '../middleware/auth.js';
import { setTestDb } from '../db/mongo.js';
import { ObjectId } from 'mongodb';
import { PERMISSIONS, SystemRole } from '@reportbd/shared';

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
    let results = this.docs.filter((d) => this.matchQuery(d, query));
    const chain: any = {
      toArray: async () => JSON.parse(JSON.stringify(results)),
      sort: () => chain,
      skip: (n: number) => {
        results = results.slice(n);
        return chain;
      },
      limit: (n: number) => {
        results = results.slice(0, n);
        return chain;
      },
    };
    return chain;
  }

  async countDocuments(query: any = {}): Promise<number> {
    return this.docs.filter((d) => this.matchQuery(d, query)).length;
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

describe('Project-Wide RBAC Enforcement & Security Quality Gates', () => {
  let server: Server;
  let baseUrl: string;
  let mockDb: MockDb;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    mockDb = new MockDb();
    setTestDb(mockDb as any);
  });

  // Helper to setup mock user and membership
  const setupUserWithRoles = async (userId: string, email: string, roles: SystemRole[], orgId = 'org_pilot') => {
    const userObjectId = new ObjectId(userId);
    await mockDb.collection('users').insertOne({
      _id: userObjectId,
      firebaseUid: `fb_${userId}`,
      email,
      name: `User ${userId}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await mockDb.collection('memberships').insertOne({
      _id: new ObjectId(),
      userId: userObjectId.toString(),
      orgId,
      roles,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  test('RBAC-1: Unauthenticated requests to all protected routes are rejected with 401 UNAUTHORIZED', async () => {
    const protectedPaths = [
      '/api/v1/daily-reports?month=2026-10',
      '/api/v1/monthly-plans/2026-10',
      '/api/v1/monthly-outcomes/2026-10',
      '/api/v1/supervisor/dashboard',
      '/api/v1/supervisor/queue',
      '/api/v1/organization/audit-events',
      '/api/v1/me',
      '/api/v1/templates/current',
    ];

    for (const path of protectedPaths) {
      const res = await fetch(`${baseUrl}${path}`);
      assert.equal(res.status, 401, `Expected 401 for ${path}, got ${res.status}`);
      const body = await res.json();
      assert.equal(body.code, 'UNAUTHORIZED');
    }
  });

  test('RBAC-2: Authenticated user without active membership receives 403 NO_ACTIVE_MEMBERSHIP', async () => {
    const unassignedUid = 'user_no_membership_01';
    setCustomTokenVerifier(async (token: string) => {
      if (token === 'token-no-membership') {
        return { uid: unassignedUid, email: 'unassigned@test.org', name: 'No Membership' };
      }
      throw new Error('Invalid token');
    });

    // Create user in DB without membership record
    await mockDb.collection('users').insertOne({
      _id: new ObjectId(),
      firebaseUid: unassignedUid,
      email: 'unassigned@test.org',
      name: 'No Membership',
      status: 'active',
    });

    const res = await fetch(`${baseUrl}/api/v1/daily-reports?month=2026-10`, {
      headers: { Authorization: 'Bearer token-no-membership' },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'NO_ACTIVE_MEMBERSHIP');
  });

  test('RBAC-3: Student role is forbidden from accessing supervisor dashboard (403 FORBIDDEN)', async () => {
    const studentUid = '507f1f77bcf86cd799439011';
    await setupUserWithRoles(studentUid, 'student@test.org', ['student']);

    setCustomTokenVerifier(async () => ({
      uid: `fb_${studentUid}`,
      email: 'student@test.org',
      name: 'Student Sabbir',
    }));

    const res = await fetch(`${baseUrl}/api/v1/supervisor/dashboard`, {
      headers: { Authorization: 'Bearer valid-student-token' },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('RBAC-4: Student role is forbidden from accessing supervisor queue (403 FORBIDDEN)', async () => {
    const studentUid = '507f1f77bcf86cd799439012';
    await setupUserWithRoles(studentUid, 'student2@test.org', ['student']);

    setCustomTokenVerifier(async () => ({
      uid: `fb_${studentUid}`,
      email: 'student2@test.org',
    }));

    const res = await fetch(`${baseUrl}/api/v1/supervisor/queue`, {
      headers: { Authorization: 'Bearer valid-student-token' },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('RBAC-5: Student role is forbidden from submitting a supervisor review (403 FORBIDDEN)', async () => {
    const studentUid = '507f1f77bcf86cd799439013';
    await setupUserWithRoles(studentUid, 'student3@test.org', ['student']);

    setCustomTokenVerifier(async () => ({
      uid: `fb_${studentUid}`,
      email: 'student3@test.org',
    }));

    const dummyOutcomeId = new ObjectId().toString();

    const res = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${dummyOutcomeId}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-student-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'acknowledge' }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('RBAC-6: Student role is forbidden from viewing organization audit events (403 FORBIDDEN)', async () => {
    const studentUid = '507f1f77bcf86cd799439014';
    await setupUserWithRoles(studentUid, 'student4@test.org', ['student']);

    setCustomTokenVerifier(async () => ({
      uid: `fb_${studentUid}`,
      email: 'student4@test.org',
    }));

    const res = await fetch(`${baseUrl}/api/v1/organization/audit-events`, {
      headers: { Authorization: 'Bearer valid-student-token' },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('RBAC-7: Student role is forbidden from creating organization invitations (403 FORBIDDEN)', async () => {
    const studentUid = '507f1f77bcf86cd799439015';
    await setupUserWithRoles(studentUid, 'student5@test.org', ['student']);

    setCustomTokenVerifier(async () => ({
      uid: `fb_${studentUid}`,
      email: 'student5@test.org',
    }));

    const res = await fetch(`${baseUrl}/api/v1/organization/invitations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-student-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'new@test.org', role: 'student' }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('RBAC-8: Pure supervisor role without student role cannot write daily reports (403 FORBIDDEN)', async () => {
    const supervisorUid = '507f1f77bcf86cd799439020';
    await setupUserWithRoles(supervisorUid, 'supervisor@test.org', ['supervisor']);

    setCustomTokenVerifier(async () => ({
      uid: `fb_${supervisorUid}`,
      email: 'supervisor@test.org',
    }));

    const res = await fetch(`${baseUrl}/api/v1/daily-reports/2026-10-28`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer supervisor-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateKey: '2026-10-28',
        values: { quran_recitation_time: 15 },
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('RBAC-9: Pure supervisor role cannot access administrative audit log (403 FORBIDDEN)', async () => {
    const supervisorUid = '507f1f77bcf86cd799439021';
    await setupUserWithRoles(supervisorUid, 'supervisor2@test.org', ['supervisor']);

    setCustomTokenVerifier(async () => ({
      uid: `fb_${supervisorUid}`,
      email: 'supervisor2@test.org',
    }));

    const res = await fetch(`${baseUrl}/api/v1/organization/audit-events`, {
      headers: { Authorization: 'Bearer supervisor-token' },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('RBAC-10: Organization admin cannot invite user as platform_admin (Privilege Escalation Blocked)', async () => {
    const adminUid = '507f1f77bcf86cd799439030';
    await setupUserWithRoles(adminUid, 'admin@test.org', ['org_admin']);

    setCustomTokenVerifier(async () => ({
      uid: `fb_${adminUid}`,
      email: 'admin@test.org',
    }));

    const res = await fetch(`${baseUrl}/api/v1/organization/invitations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'attacker@evil.org',
        role: 'platform_admin',
      }),
    });

    // Both 400 (strict schema enum whitelist) and 403 (explicit authorization check) safely block escalation
    assert.ok(
      res.status === 400 || res.status === 403,
      `Expected status 400 or 403 for privilege escalation attempt, got ${res.status}`
    );
    const body = await res.json();
    assert.ok(
      body.code === 'INVITATION_CREATION_FAILED' || body.code === 'VALIDATION_ERROR' || body.code === 'FORBIDDEN',
      `Expected INVITATION_CREATION_FAILED, VALIDATION_ERROR or FORBIDDEN, got ${body.code}`
    );
  });

  test('RBAC-11: Multi-role user holding both student and supervisor roles can access both capabilities', async () => {
    const multiRoleUid = '507f1f77bcf86cd799439040';
    await setupUserWithRoles(multiRoleUid, 'multirole@test.org', ['student', 'supervisor']);

    setCustomTokenVerifier(async () => ({
      uid: `fb_${multiRoleUid}`,
      email: 'multirole@test.org',
      name: 'Multi Role User',
    }));

    // 1. Can access student reporting
    const studentRes = await fetch(`${baseUrl}/api/v1/daily-reports?month=2026-10`, {
      headers: { Authorization: 'Bearer multi-token' },
    });
    assert.equal(studentRes.status, 200, 'Student endpoint should succeed for multi-role user');

    // 2. Can access supervisor dashboard
    const supervisorRes = await fetch(`${baseUrl}/api/v1/supervisor/dashboard`, {
      headers: { Authorization: 'Bearer multi-token' },
    });
    assert.equal(supervisorRes.status, 200, 'Supervisor dashboard should succeed for multi-role user');
  });

  test('RBAC-12: GET /api/v1/me returns trusted server-evaluated permissions array', async () => {
    const studentUid = '507f1f77bcf86cd799439050';
    await setupUserWithRoles(studentUid, 'student_me@test.org', ['student']);

    setCustomTokenVerifier(async () => ({
      uid: `fb_${studentUid}`,
      email: 'student_me@test.org',
      name: 'Student Profile Check',
    }));

    const res = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Authorization: 'Bearer me-token' },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.user.permissions), 'Permissions must be returned as an array');
    assert.ok(body.user.permissions.includes(PERMISSIONS.DAILY_REPORT_READ_OWN));
    assert.ok(body.user.permissions.includes(PERMISSIONS.DAILY_REPORT_WRITE_OWN));
    assert.ok(!body.user.permissions.includes(PERMISSIONS.ORG_AUDIT_READ), 'Student should not hold audit permission');
  });
});
