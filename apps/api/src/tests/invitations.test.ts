import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { app } from '../app.js';
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
    if (query.$or && Array.isArray(query.$or)) {
      return query.$or.some((subQuery: any) => this.matchQuery(doc, subQuery));
    }

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

describe('Organization Onboarding & Invitations Tests (Phase 2)', () => {
  let server: Server;
  let baseUrl: string;
  let mockDb: MockDb;

  const adminUserId = new ObjectId();
  const studentUserId = new ObjectId();
  const newUserId = new ObjectId();

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
    if (server) {
      server.close();
    }
    setTestDb(null);
    setCustomTokenVerifier(null);
  });

  beforeEach(async () => {
    mockDb = new MockDb();
    setTestDb(mockDb as any);

    // Seed default organization
    await mockDb.collection('organizations').insertOne({
      id: 'org_alpha',
      nameBn: 'ঢাকা বিশ্ববিদ্যালয় শাখা',
      nameEn: 'Dhaka University Branch',
      slug: 'org_alpha',
      status: 'active',
    });

    // Seed Org Admin
    await mockDb.collection('users').insertOne({
      _id: adminUserId,
      firebaseUid: 'uid_org_admin',
      email: 'admin@reportbd.org',
      name: 'Admin User',
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      userId: adminUserId.toString(),
      orgId: 'org_alpha',
      roles: ['org_admin'],
      status: 'active',
    });

    // Seed Existing Student
    await mockDb.collection('users').insertOne({
      _id: studentUserId,
      firebaseUid: 'uid_existing_student',
      email: 'student@reportbd.org',
      name: 'Existing Student',
      status: 'active',
    });
    await mockDb.collection('memberships').insertOne({
      userId: studentUserId.toString(),
      orgId: 'org_alpha',
      roles: ['student'],
      status: 'active',
    });

    // Seed New User (Authenticated in Firebase, but NO membership yet)
    await mockDb.collection('users').insertOne({
      _id: newUserId,
      firebaseUid: 'uid_new_invitee',
      email: 'newuser@reportbd.org',
      name: 'New Invitee',
      status: 'active',
    });

    setCustomTokenVerifier(async (token: string) => {
      if (token === 'token-admin') {
        return { uid: 'uid_org_admin', email: 'admin@reportbd.org', name: 'Admin User' };
      }
      if (token === 'token-student') {
        return { uid: 'uid_existing_student', email: 'student@reportbd.org', name: 'Existing Student' };
      }
      if (token === 'token-new-invitee') {
        return { uid: 'uid_new_invitee', email: 'newuser@reportbd.org', name: 'New Invitee' };
      }
      throw new Error('Invalid test token');
    });
  });

  test('Inv-1: Org admin can successfully generate an expiring invitation', async () => {
    const res = await fetch(`${baseUrl}/api/v1/organization/invitations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'newstudent@reportbd.org',
        role: 'student',
        expiresInDays: 7,
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.invitation.token);
    assert.equal(json.invitation.email, 'newstudent@reportbd.org');
    assert.equal(json.invitation.role, 'student');
    assert.equal(json.invitation.status, 'pending');
    assert.ok(new Date(json.invitation.expiresAt) > new Date());
  });

  test('Inv-2: Non-admin (student) is forbidden from creating invitations', async () => {
    const res = await fetch(`${baseUrl}/api/v1/organization/invitations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-student',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'friend@reportbd.org',
        role: 'student',
      }),
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.code, 'FORBIDDEN');
  });

  test('Inv-3: Cannot invite a user who already has an active membership in the organization', async () => {
    const res = await fetch(`${baseUrl}/api/v1/organization/invitations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'student@reportbd.org', // Already in memberships for org_alpha
        role: 'student',
      }),
    });

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.code, 'ALREADY_MEMBER');
  });

  test('Inv-4: Public preview of invitation details returns organization and role info', async () => {
    // Admin creates invitation
    const createRes = await fetch(`${baseUrl}/api/v1/organization/invitations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'applicant@reportbd.org',
        role: 'supervisor',
      }),
    });
    const { invitation } = await createRes.json();

    // Invitee previews the invitation
    const previewRes = await fetch(`${baseUrl}/api/v1/invitations/${invitation.token}`);
    assert.equal(previewRes.status, 200);
    const previewData = await previewRes.json();
    assert.equal(previewData.valid, true);
    assert.equal(previewData.invitation.email, 'applicant@reportbd.org');
    assert.equal(previewData.invitation.role, 'supervisor');
    assert.equal(previewData.organization.id, 'org_alpha');
    assert.equal(previewData.organization.nameBn, 'ঢাকা বিশ্ববিদ্যালয় শাখা');
  });

  test('Inv-5: Expired invitation returns 410 Gone and cannot be accepted', async () => {
    const expiredToken = 'expired_invitation_token_1234567890';
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    await mockDb.collection('invitations').insertOne({
      orgId: 'org_alpha',
      email: 'expired@reportbd.org',
      role: 'student',
      token: expiredToken,
      status: 'pending',
      expiresAt: pastDate,
      createdAt: pastDate,
    });

    // Preview expired
    const previewRes = await fetch(`${baseUrl}/api/v1/invitations/${expiredToken}`);
    assert.equal(previewRes.status, 410);

    // Accept attempt on expired token
    const acceptRes = await fetch(`${baseUrl}/api/v1/invitations/${expiredToken}/accept`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-new-invitee' },
    });
    assert.equal(acceptRes.status, 410);
  });

  test('Inv-6: New user accepts valid invitation, receives active membership, and gains organization access', async () => {
    // 1. Prior to accepting, new user is blocked from organization routes (403 NO_ACTIVE_MEMBERSHIP)
    const initialReq = await fetch(`${baseUrl}/api/v1/templates/current`, {
      headers: { Authorization: 'Bearer token-new-invitee' },
    });
    assert.equal(initialReq.status, 403);

    // 2. Admin creates invitation for the new user
    const createRes = await fetch(`${baseUrl}/api/v1/organization/invitations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'newuser@reportbd.org',
        role: 'student',
      }),
    });
    const { invitation } = await createRes.json();

    // 3. New user accepts the invitation
    const acceptRes = await fetch(`${baseUrl}/api/v1/invitations/${invitation.token}/accept`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-new-invitee' },
    });
    assert.equal(acceptRes.status, 200);
    const acceptData = await acceptRes.json();
    assert.equal(acceptData.success, true);
    assert.equal(acceptData.membership.orgId, 'org_alpha');
    assert.deepEqual(acceptData.membership.roles, ['student']);

    // 4. Now that membership is active, new user successfully completes organization requests!
    const postAcceptReq = await fetch(`${baseUrl}/api/v1/templates/current`, {
      headers: { Authorization: 'Bearer token-new-invitee' },
    });
    assert.equal(postAcceptReq.status, 200);
    const templateData = await postAcceptReq.json();
    assert.ok(templateData.template);
  });

  test('Inv-7: User can list all active organization memberships via GET /api/v1/me/memberships', async () => {
    const res = await fetch(`${baseUrl}/api/v1/me/memberships`, {
      headers: { Authorization: 'Bearer token-admin' },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.memberships));
    assert.equal(json.memberships.length, 1);
    assert.equal(json.memberships[0].orgId, 'org_alpha');
    assert.deepEqual(json.memberships[0].roles, ['org_admin']);
    assert.equal(json.memberships[0].organization.nameBn, 'ঢাকা বিশ্ববিদ্যালয় শাখা');
  });

  test('Inv-8: Admin can revoke a pending invitation', async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/organization/invitations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'revokeme@reportbd.org',
        role: 'student',
      }),
    });
    const { invitation } = await createRes.json();

    const deleteRes = await fetch(`${baseUrl}/api/v1/organization/invitations/${invitation.id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token-admin' },
    });
    assert.equal(deleteRes.status, 200);

    // After revocation, accepting returns 410
    const acceptRes = await fetch(`${baseUrl}/api/v1/invitations/${invitation.token}/accept`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-new-invitee' },
    });
    assert.equal(acceptRes.status, 410);
  });
});
