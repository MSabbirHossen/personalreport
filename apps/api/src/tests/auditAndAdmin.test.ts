import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { app } from '../app.js';
import { setCustomTokenVerifier } from '../middleware/auth.js';
import { setTestDb } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

class MockCollection {
  private docs: any[] = [];
  private uniqueIndexes: Array<string[]> = [];

  constructor(initialDocs: any[] = []) {
    this.docs = JSON.parse(JSON.stringify(initialDocs));
  }

  addUniqueIndex(fields: string[]) {
    this.uniqueIndexes.push(fields);
  }

  async findOne(query: any = {}): Promise<any | null> {
    const found = this.docs.find((d) => this.matchQuery(d, query));
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  find(query: any = {}) {
    let results = this.docs.filter((d) => this.matchQuery(d, query));
    const chain: any = {
      toArray: async () => JSON.parse(JSON.stringify(results)),
      sort: (sortSpec: any = {}) => {
        results = [...results].sort((a, b) => {
          for (const k of Object.keys(sortSpec)) {
            if (a[k] < b[k]) return sortSpec[k] === 1 ? -1 : 1;
            if (a[k] > b[k]) return sortSpec[k] === 1 ? 1 : -1;
          }
          return 0;
        });
        return chain;
      },
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
    for (const fields of this.uniqueIndexes) {
      const hasUndefined = fields.some((f) => doc[f] === undefined || doc[f] === null);
      if (hasUndefined) continue;

      const matchKey: any = {};
      for (const f of fields) {
        matchKey[f] = doc[f];
      }
      const existing = this.docs.find((d) => this.matchQuery(d, matchKey));
      if (existing) {
        const err: any = new Error(`E11000 duplicate key error: ${fields.join(', ')}`);
        err.code = 11000;
        throw err;
      }
    }

    const inserted = {
      ...doc,
      _id: doc._id || new ObjectId(),
    };
    this.docs.push(inserted);
    return { insertedId: inserted._id };
  }

  async updateOne(query: any, update: any, options: any = {}): Promise<{ matchedCount: number; modifiedCount: number }> {
    const idx = this.docs.findIndex((d) => this.matchQuery(d, query));
    if (idx === -1) {
      if (options.upsert) {
        const newDoc = {
          _id: new ObjectId(),
          ...(update.$set || {}),
          ...(update.$setOnInsert || {}),
        };
        this.docs.push(newDoc);
        return { matchedCount: 0, modifiedCount: 1 };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const target = this.docs[idx];
    if (update.$set) {
      Object.assign(target, update.$set);
    }
    return { matchedCount: 1, modifiedCount: 1 };
  }

  private matchQuery(doc: any, query: any): boolean {
    for (const key of Object.keys(query)) {
      const qVal = query[key];
      if (typeof qVal === 'object' && qVal !== null) {
        if ('$in' in qVal) {
          const arr = qVal.$in.map((item: any) => (item?.toString ? item.toString() : item));
          const docVal = doc[key]?.toString ? doc[key].toString() : doc[key];
          if (!arr.includes(docVal)) return false;
          continue;
        }
        if ('$gte' in qVal && doc[key] < qVal.$gte) return false;
        if ('$lte' in qVal && doc[key] > qVal.$lte) return false;
        if ('$gt' in qVal && doc[key] <= qVal.$gt) return false;
        if ('$lt' in qVal && doc[key] >= qVal.$lt) return false;
        continue;
      }

      if (key === '_id') {
        const docId = doc._id?.toString ? doc._id.toString() : doc._id;
        const targetId = qVal?.toString ? qVal.toString() : qVal;
        if (docId !== targetId) return false;
        continue;
      }

      if (doc[key] !== qVal) return false;
    }
    return true;
  }
}

class MockDb {
  collections: Record<string, MockCollection> = {};

  collection(name: string): MockCollection {
    if (!this.collections[name]) {
      this.collections[name] = new MockCollection();
    }
    return this.collections[name];
  }
}

describe('Administrative Audit Log Explorer (ADMIN-07)', () => {
  let server: Server;
  let port: number;
  let baseUrl: string;
  let mockDb: MockDb;

  const testOrgId = 'org_dhaka_central';
  const otherOrgId = 'org_chittagong';

  const adminObjId = new ObjectId();
  const studentObjId = new ObjectId();
  const supervisorObjId = new ObjectId();

  const orgAdminUser = {
    userId: adminObjId.toString(),
    firebaseUid: 'fb_admin_1',
    orgId: testOrgId,
    roles: ['org_admin'],
    name: 'Admin User',
  };

  const studentUser = {
    userId: studentObjId.toString(),
    firebaseUid: 'fb_student_1',
    orgId: testOrgId,
    roles: ['student'],
    name: 'Student One',
  };

  const supervisorUser = {
    userId: supervisorObjId.toString(),
    firebaseUid: 'fb_supervisor_1',
    orgId: testOrgId,
    roles: ['supervisor'],
    name: 'Supervisor One',
  };

  before(async () => {
    mockDb = new MockDb();
    setTestDb(mockDb as any);

    setCustomTokenVerifier(async (token: string) => {
      if (token === 'admin-token') {
        return {
          uid: orgAdminUser.firebaseUid,
          userId: orgAdminUser.userId,
          email: 'admin@reportbd.test',
          roles: orgAdminUser.roles,
          orgId: orgAdminUser.orgId,
          name: orgAdminUser.name,
        };
      }
      if (token === 'student-token') {
        return {
          uid: studentUser.firebaseUid,
          userId: studentUser.userId,
          email: 'student@reportbd.test',
          roles: studentUser.roles,
          orgId: studentUser.orgId,
          name: studentUser.name,
        };
      }
      if (token === 'supervisor-token') {
        return {
          uid: supervisorUser.firebaseUid,
          userId: supervisorUser.userId,
          email: 'supervisor@reportbd.test',
          roles: supervisorUser.roles,
          orgId: supervisorUser.orgId,
          name: supervisorUser.name,
        };
      }
      throw new Error('Invalid token');
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) {
          port = addr.port;
          baseUrl = `http://localhost:${port}/api/v1`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    setTestDb(null);
    setCustomTokenVerifier(null);
  });

  beforeEach(async () => {
    mockDb.collections = {};

    // Seed users
    await mockDb.collection('users').insertOne({
      _id: adminObjId,
      firebaseUid: orgAdminUser.firebaseUid,
      email: 'admin@reportbd.test',
      name: orgAdminUser.name,
      status: 'active',
    });

    await mockDb.collection('users').insertOne({
      _id: studentObjId,
      firebaseUid: studentUser.firebaseUid,
      email: 'student@reportbd.test',
      name: studentUser.name,
      status: 'active',
    });

    await mockDb.collection('users').insertOne({
      _id: supervisorObjId,
      firebaseUid: supervisorUser.firebaseUid,
      email: 'supervisor@reportbd.test',
      name: supervisorUser.name,
      status: 'active',
    });

    // Seed memberships
    await mockDb.collection('memberships').insertOne({
      orgId: testOrgId,
      userId: orgAdminUser.userId,
      roles: ['org_admin'],
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      orgId: testOrgId,
      userId: studentUser.userId,
      roles: ['student'],
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      orgId: testOrgId,
      userId: supervisorUser.userId,
      roles: ['supervisor'],
      status: 'active',
    });

    // Seed initial audit events
    const sampleEvents = [
      {
        orgId: testOrgId,
        actorId: orgAdminUser.userId,
        actorRole: 'org_admin',
        action: 'invitation.created',
        entityType: 'invitation',
        entityId: 'inv_101',
        time: '2026-10-20T10:00:00.000Z',
        metadata: { email: 'newstudent@test.com', role: 'student' },
      },
      {
        orgId: testOrgId,
        actorId: orgAdminUser.userId,
        actorRole: 'org_admin',
        action: 'assignment.created',
        entityType: 'supervisorAssignment',
        entityId: 'asgn_201',
        time: '2026-10-21T11:00:00.000Z',
        metadata: { studentId: studentUser.userId, supervisorId: supervisorUser.userId },
      },
      {
        orgId: testOrgId,
        actorId: studentUser.userId,
        actorRole: 'student',
        action: 'report.submitted',
        entityType: 'monthlyOutcome',
        entityId: `${studentUser.userId}_2026-10`,
        time: '2026-10-22T14:30:00.000Z',
        metadata: { monthKey: '2026-10', dailyReportsCount: 20 },
      },
      {
        orgId: testOrgId,
        actorId: supervisorUser.userId,
        actorRole: 'supervisor',
        action: 'review.acknowledged',
        entityType: 'monthlyOutcome',
        entityId: `${studentUser.userId}_2026-10`,
        time: '2026-10-23T16:00:00.000Z',
        metadata: { status: 'acknowledged', action: 'acknowledge' },
      },
      // Event from another organization (must be isolated)
      {
        orgId: otherOrgId,
        actorId: 'other_admin',
        actorRole: 'org_admin',
        action: 'invitation.created',
        entityType: 'invitation',
        entityId: 'inv_other',
        time: '2026-10-22T12:00:00.000Z',
        metadata: { email: 'secret@other.com' },
      },
    ];

    for (const ev of sampleEvents) {
      mockDb.collection('auditEvents').insertOne(ev);
    }
  });

  test('Audit-1: Student is forbidden from accessing administrative audit log (403 FORBIDDEN)', async () => {
    const res = await fetch(`${baseUrl}/organization/audit-events`, {
      headers: { Authorization: 'Bearer student-token' },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('Audit-2: Supervisor is forbidden from accessing administrative audit log (403 FORBIDDEN)', async () => {
    const res = await fetch(`${baseUrl}/organization/audit-events`, {
      headers: { Authorization: 'Bearer supervisor-token' },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('Audit-3: Organization admin can retrieve audit events strictly scoped to their orgId', async () => {
    const res = await fetch(`${baseUrl}/organization/audit-events`, {
      headers: { Authorization: 'Bearer admin-token' },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.events));
    assert.equal(body.total, 4); // Only the 4 events for testOrgId, excluding otherOrgId
    assert.equal(body.events.length, 4);

    // Cross-tenant verification: None of the events belong to otherOrgId
    for (const ev of body.events) {
      assert.equal(ev.orgId, testOrgId);
      assert.notEqual(ev.orgId, otherOrgId);
      assert.notEqual(ev.metadata?.email, 'secret@other.com');
    }
  });

  test('Audit-4: Filter audit events by action', async () => {
    const res = await fetch(`${baseUrl}/organization/audit-events?action=review.acknowledged`, {
      headers: { Authorization: 'Bearer admin-token' },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.total, 1);
    assert.equal(body.events.length, 1);
    assert.equal(body.events[0].action, 'review.acknowledged');
    assert.equal(body.events[0].actorId, supervisorUser.userId);
  });

  test('Audit-5: Filter audit events by entityType', async () => {
    const res = await fetch(`${baseUrl}/organization/audit-events?entityType=monthlyOutcome`, {
      headers: { Authorization: 'Bearer admin-token' },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.total, 2);
    for (const ev of body.events) {
      assert.equal(ev.entityType, 'monthlyOutcome');
    }
  });

  test('Audit-6: Filter audit events by date range (from / to)', async () => {
    const res = await fetch(
      `${baseUrl}/organization/audit-events?from=2026-10-21T00:00:00.000Z&to=2026-10-22T23:59:59.999Z`,
      {
        headers: { Authorization: 'Bearer admin-token' },
      }
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.total, 2); // 2026-10-21 and 2026-10-22 events
  });

  test('Audit-7: Pagination limit and offset', async () => {
    const res = await fetch(`${baseUrl}/organization/audit-events?limit=2&offset=1`, {
      headers: { Authorization: 'Bearer admin-token' },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.total, 4);
    assert.equal(body.limit, 2);
    assert.equal(body.offset, 1);
    assert.equal(body.events.length, 2);
  });

  test('Audit-8: Invalid query parameters (e.g. invalid limit) rejected with 400', async () => {
    const res = await fetch(`${baseUrl}/organization/audit-events?limit=999`, {
      headers: { Authorization: 'Bearer admin-token' },
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'INVALID_QUERY');
  });

  test('Audit-9: Creating an invitation automatically generates an auditable record without exposing token', async () => {
    const createRes = await fetch(`${baseUrl}/organization/invitations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'audit_test@reportbd.org',
        role: 'student',
        expiresInDays: 7,
      }),
    });

    assert.equal(createRes.status, 200);
    const createBody = await createRes.json();
    const invId = createBody.invitation.id;

    // Verify audit record was created
    const auditRes = await fetch(
      `${baseUrl}/organization/audit-events?action=invitation.created`,
      {
        headers: { Authorization: 'Bearer admin-token' },
      }
    );

    assert.equal(auditRes.status, 200);
    const auditBody = await auditRes.json();
    const createdEvent = auditBody.events.find((e: any) => e.entityId === invId);
    assert.ok(createdEvent, 'Audit event for created invitation should exist');
    assert.equal(createdEvent.metadata.email, 'audit_test@reportbd.org');
    // Ensure sensitive token is NOT stored in metadata
    assert.equal(createdEvent.metadata.token, undefined);
  });

  test('Audit-10: Revoking an invitation records an audit event', async () => {
    // Insert pending invitation
    const invResult = await mockDb.collection('invitations').insertOne({
      orgId: testOrgId,
      email: 'revoke_me@test.com',
      role: 'student',
      status: 'pending',
    });
    const invId = invResult.insertedId.toString();

    const revokeRes = await fetch(`${baseUrl}/organization/invitations/${invId}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer admin-token' },
    });

    assert.equal(revokeRes.status, 200);

    // Verify audit record was created
    const auditRes = await fetch(
      `${baseUrl}/organization/audit-events?action=invitation.revoked`,
      {
        headers: { Authorization: 'Bearer admin-token' },
      }
    );

    assert.equal(auditRes.status, 200);
    const auditBody = await auditRes.json();
    const revokedEvent = auditBody.events.find((e: any) => e.entityId === invId);
    assert.ok(revokedEvent, 'Audit event for revoked invitation should exist');
    assert.equal(revokedEvent.metadata.status, 'revoked');
  });
});
