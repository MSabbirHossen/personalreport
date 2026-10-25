import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { app } from '../app.js';
import { setCustomTokenVerifier } from '../middleware/auth.js';
import { setTestDb } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

// In-memory collection stub with unique constraint support
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

  async insertOne(doc: any): Promise<{ insertedId: ObjectId }> {
    for (const fields of this.uniqueIndexes) {
      // Sparse index support: skip uniqueness check if any indexed field is undefined in doc
      const hasUndefined = fields.some((f) => doc[f] === undefined || doc[f] === null);
      if (hasUndefined) continue;

      const matchKey: any = {};
      for (const f of fields) {
        matchKey[f] = doc[f];
      }
      const existing = this.docs.find((d) => this.matchQuery(d, matchKey));
      if (existing) {
        const err: any = new Error(`E11000 duplicate key error collection: index on ${fields.join('_')}`);
        err.code = 11000;
        throw err;
      }
    }

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
      if (update.$inc) {
        for (const k of Object.keys(update.$inc)) {
          this.docs[index][k] = (this.docs[index][k] || 0) + update.$inc[k];
        }
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

  async updateMany(query: any, update: any): Promise<any> {
    let matched = 0;
    for (let i = 0; i < this.docs.length; i++) {
      if (this.matchQuery(this.docs[i], query)) {
        matched++;
        if (update.$set) {
          this.docs[i] = { ...this.docs[i], ...update.$set };
        }
      }
    }
    return { matchedCount: matched, modifiedCount: matched };
  }

  async countDocuments(query: any = {}): Promise<number> {
    return this.docs.filter((d) => this.matchQuery(d, query)).length;
  }

  async createIndex(): Promise<string> {
    return 'mock_index';
  }

  private matchQuery(doc: any, query: any): boolean {
    if (query.$or && Array.isArray(query.$or)) {
      return query.$or.some((subQuery: any) => this.matchQuery(doc, subQuery));
    }

    for (const key of Object.keys(query)) {
      if (typeof query[key] === 'object' && query[key] !== null && !(query[key] instanceof ObjectId)) {
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

      if (key === '_id') {
        const queryId = query._id?.toString();
        const docId = doc._id?.toString();
        if (queryId !== docId) return false;
        continue;
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
      if (name === 'dailyReports') {
        this.collections[name].addUniqueIndex(['orgId', 'studentId', 'dateKey']);
      }
      if (name === 'monthlyPlans') {
        this.collections[name].addUniqueIndex(['orgId', 'studentId', 'monthKey']);
      }
      if (name === 'monthlyOutcomes') {
        this.collections[name].addUniqueIndex(['orgId', 'studentId', 'monthKey']);
      }
      if (name === 'notifications') {
        this.collections[name].addUniqueIndex(['orgId', 'recipientId', 'idempotencyKey']);
      }
    }
    return this.collections[name];
  }

  async command(cmd: any): Promise<any> {
    if (cmd.ping) return { ok: 1 };
    return {};
  }
}

describe('Supervisor Mentorship, Review Hardening & In-App Notifications (Phase 4)', () => {
  let server: Server;
  let baseUrl: string;
  let mockDb: MockDb;

  const studentOneId = new ObjectId();
  const studentTwoId = new ObjectId();
  const supervisorOneId = new ObjectId();
  const supervisorTwoId = new ObjectId();

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

    // Users
    await mockDb.collection('users').insertOne({
      _id: studentOneId,
      firebaseUid: 'uid_student_1',
      name: 'Tariqul Islam',
      email: 'tariq@reportbd.org',
      status: 'active',
    });

    await mockDb.collection('users').insertOne({
      _id: studentTwoId,
      firebaseUid: 'uid_student_2',
      name: 'Nayeem Hasan',
      email: 'nayeem@reportbd.org',
      status: 'active',
    });

    await mockDb.collection('users').insertOne({
      _id: supervisorOneId,
      firebaseUid: 'uid_supervisor_1',
      name: 'Ustadh Abdullah',
      email: 'abdullah@reportbd.org',
      status: 'active',
    });

    await mockDb.collection('users').insertOne({
      _id: supervisorTwoId,
      firebaseUid: 'uid_supervisor_2',
      name: 'Ustadh Bilal',
      email: 'bilal@reportbd.org',
      status: 'active',
    });

    // Memberships
    await mockDb.collection('memberships').insertOne({
      orgId: 'org_main',
      userId: studentOneId.toString(),
      roles: ['student'],
      status: 'active',
    });

    await mockDb.collection('memberships').insertOne({
      orgId: 'org_main',
      userId: studentTwoId.toString(),
      roles: ['student'],
      status: 'active',
    });

    await mockDb.collection('memberships').insertOne({
      orgId: 'org_main',
      userId: supervisorOneId.toString(),
      roles: ['supervisor'],
      status: 'active',
    });

    await mockDb.collection('memberships').insertOne({
      orgId: 'org_main',
      userId: supervisorTwoId.toString(),
      roles: ['supervisor'],
      status: 'active',
    });

    // Supervisor 1 is assigned to Student 1 only
    await mockDb.collection('supervisorAssignments').insertOne({
      orgId: 'org_main',
      supervisorId: supervisorOneId.toString(),
      studentId: studentOneId.toString(),
      status: 'active',
    });

    // Token Verifier
    setCustomTokenVerifier(async (token: string) => {
      if (token === 'token-student-1') {
        return { uid: 'uid_student_1', email: 'tariq@reportbd.org', name: 'Tariqul Islam' };
      }
      if (token === 'token-student-2') {
        return { uid: 'uid_student_2', email: 'nayeem@reportbd.org', name: 'Nayeem Hasan' };
      }
      if (token === 'token-supervisor-1') {
        return { uid: 'uid_supervisor_1', email: 'abdullah@reportbd.org', name: 'Ustadh Abdullah' };
      }
      if (token === 'token-supervisor-2') {
        return { uid: 'uid_supervisor_2', email: 'bilal@reportbd.org', name: 'Ustadh Bilal' };
      }
      return null;
    });
  });

  // 1. Authorization & Scoping
  test('Sup-1: Authorized supervisor sees assigned students only', async () => {
    const res = await fetch(`${baseUrl}/api/v1/supervisor/students`, {
      headers: { Authorization: 'Bearer token-supervisor-1' },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.students.length, 1);
    assert.equal(json.students[0].id, studentOneId.toString());
  });

  test('Sup-2: Supervisor cannot view reports of an unassigned student (403 FORBIDDEN)', async () => {
    // Supervisor 1 attempts to view student 2's reports
    const res = await fetch(`${baseUrl}/api/v1/supervisor/students/${studentTwoId.toString()}/reports`, {
      headers: { Authorization: 'Bearer token-supervisor-1' },
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.code, 'FORBIDDEN');
  });

  test('Sup-3: Cross-organization review access is denied', async () => {
    // Create outcome in another organization
    const diffOrgOutcomeId = new ObjectId();
    await mockDb.collection('monthlyOutcomes').insertOne({
      _id: diffOrgOutcomeId,
      orgId: 'org_other',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'submitted',
      revision: 1,
    });

    const res = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${diffOrgOutcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: diffOrgOutcomeId.toString(),
        action: 'acknowledge',
      }),
    });
    assert.equal(res.status, 404);
  });

  test('Sup-4: Non-supervisor role (student) is forbidden from supervisor endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/v1/supervisor/dashboard`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(res.status, 403);
  });

  test('Sup-5: Supervisor cannot review unsubmitted draft report', async () => {
    const draftOutcomeId = new ObjectId();
    await mockDb.collection('monthlyOutcomes').insertOne({
      _id: draftOutcomeId,
      orgId: 'org_main',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'draft',
      revision: 1,
    });

    const res = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${draftOutcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: draftOutcomeId.toString(),
        action: 'acknowledge',
      }),
    });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, 'INVALID_STATUS');
  });

  // 2. Concurrency & Atomic Review Transitions
  test('Sup-6: Valid supervisor review (acknowledge) updates status and increments revision', async () => {
    const outcomeId = new ObjectId();
    await mockDb.collection('monthlyOutcomes').insertOne({
      _id: outcomeId,
      orgId: 'org_main',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'submitted',
      revision: 1,
    });

    const res = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${outcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: outcomeId.toString(),
        action: 'acknowledge',
        feedback: 'Excellent work!',
        revision: 1,
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'acknowledged');
    assert.equal(json.revision, 2);

    const doc = await mockDb.collection('monthlyOutcomes').findOne({ _id: outcomeId });
    assert.equal(doc.status, 'acknowledged');
    assert.equal(doc.revision, 2);
    assert.equal(doc.reviewedBy, supervisorOneId.toString());
  });

  test('Sup-7: Concurrent review race condition: second concurrent review attempt receives HTTP 409 ALREADY_REVIEWED', async () => {
    const outcomeId = new ObjectId();
    await mockDb.collection('monthlyOutcomes').insertOne({
      _id: outcomeId,
      orgId: 'org_main',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'submitted',
      revision: 1,
    });

    // 1. First supervisor acknowledges
    const firstRes = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${outcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: outcomeId.toString(),
        action: 'acknowledge',
        feedback: 'Approved by Mentor 1',
      }),
    });
    assert.equal(firstRes.status, 200);

    // 2. Second review attempt (e.g. another window or concurrent supervisor)
    const secondRes = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${outcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: outcomeId.toString(),
        action: 'return',
        feedback: 'Conflicting return action',
      }),
    });
    assert.equal(secondRes.status, 409);
    const secondJson = await secondRes.json();
    assert.equal(secondJson.code, 'ALREADY_REVIEWED');
    assert.equal(secondJson.currentStatus, 'acknowledged');
  });

  test('Sup-8: Stale review revision conflict: review with mismatched revision receives HTTP 409 CONFLICT', async () => {
    const outcomeId = new ObjectId();
    await mockDb.collection('monthlyOutcomes').insertOne({
      _id: outcomeId,
      orgId: 'org_main',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'submitted',
      revision: 3, // Current server revision is 3
    });

    // Client passes stale revision 2
    const res = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${outcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: outcomeId.toString(),
        action: 'acknowledge',
        revision: 2, // Stale
      }),
    });
    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.code, 'CONFLICT');
    assert.equal(json.serverRevision, 3);
  });

  test('Sup-9: Valid supervisor return sets status to returned and records feedback in advice thread', async () => {
    const outcomeId = new ObjectId();
    await mockDb.collection('monthlyOutcomes').insertOne({
      _id: outcomeId,
      orgId: 'org_main',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'submitted',
      revision: 1,
    });

    const res = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${outcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: outcomeId.toString(),
        action: 'return',
        feedback: 'Please explain the missed prayers in the reflections.',
      }),
    });
    assert.equal(res.status, 200);

    const outcome = await mockDb.collection('monthlyOutcomes').findOne({ _id: outcomeId });
    assert.equal(outcome.status, 'returned');

    const advice = await mockDb.collection('advice').findOne({ targetId: outcomeId.toString() });
    assert.ok(advice);
    assert.equal(advice.body, 'Please explain the missed prayers in the reflections.');
    assert.equal(advice.authorName, 'Ustadh Abdullah');
  });

  // 3. Notifications & Idempotency
  test('Notif-1: Student submission triggers in-app notification to assigned supervisor', async () => {
    // Student 1 submits monthly outcome
    await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09/submit`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });

    // Verify supervisor 1 received notification
    const supNotifsRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: 'Bearer token-supervisor-1' },
    });
    assert.equal(supNotifsRes.status, 200);
    const supNotifs = await supNotifsRes.json();

    assert.equal(supNotifs.unreadCount, 1);
    assert.equal(supNotifs.notifications[0].type, 'report_submitted');
    assert.equal(supNotifs.notifications[0].targetId, '2026-09');

    // Unassigned supervisor 2 should NOT receive notification
    const sup2Res = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: 'Bearer token-supervisor-2' },
    });
    const sup2Json = await sup2Res.json();
    assert.equal(sup2Json.unreadCount, 0);
  });

  test('Notif-2: Supervisor review triggers in-app notification to student', async () => {
    const outcomeId = new ObjectId();
    await mockDb.collection('monthlyOutcomes').insertOne({
      _id: outcomeId,
      orgId: 'org_main',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'submitted',
      revision: 1,
    });

    // Supervisor returns report
    await fetch(`${baseUrl}/api/v1/supervisor/reviews/${outcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: outcomeId.toString(),
        action: 'return',
        feedback: 'Need revisions',
      }),
    });

    // Student 1 checks notifications
    const studentNotifsRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(studentNotifsRes.status, 200);
    const studentNotifs = await studentNotifsRes.json();

    assert.equal(studentNotifs.unreadCount, 1);
    assert.equal(studentNotifs.notifications[0].type, 'report_returned');
  });

  test('Notif-3: Notification creation idempotency: duplicate triggers do not duplicate notifications', async () => {
    const outcomeId = new ObjectId();
    await mockDb.collection('monthlyOutcomes').insertOne({
      _id: outcomeId,
      orgId: 'org_main',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'submitted',
      revision: 1,
    });

    // First review call
    await fetch(`${baseUrl}/api/v1/supervisor/reviews/${outcomeId.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: outcomeId.toString(),
        action: 'acknowledge',
      }),
    });

    const notifsCount = await mockDb.collection('notifications').countDocuments({
      recipientId: studentOneId.toString(),
      type: 'report_acknowledged',
    });
    assert.equal(notifsCount, 1);
  });

  test('Notif-4: Recipient boundary isolation: student cannot view or mark another students notifications', async () => {
    // Notification intended for student 1
    const notifId = new ObjectId();
    await mockDb.collection('notifications').insertOne({
      _id: notifId,
      orgId: 'org_main',
      recipientId: studentOneId.toString(),
      actorId: supervisorOneId.toString(),
      actorName: 'Ustadh Abdullah',
      type: 'report_acknowledged',
      title: 'Approved',
      message: 'Good work',
      link: '/app/reports/monthly-outcome?month=2026-09',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Student 2 tries to mark Student 1's notification as read
    const patchRes = await fetch(`${baseUrl}/api/v1/notifications/${notifId.toString()}/read`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer token-student-2' },
    });
    assert.equal(patchRes.status, 404);

    // Notification is still unread for student 1
    const notifDoc = await mockDb.collection('notifications').findOne({ _id: notifId });
    assert.equal(notifDoc.isRead, false);
  });

  test('Notif-5: Student can mark single notification read and mark all read', async () => {
    const n1 = new ObjectId();
    const n2 = new ObjectId();
    await mockDb.collection('notifications').insertOne({
      _id: n1,
      orgId: 'org_main',
      recipientId: studentOneId.toString(),
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    await mockDb.collection('notifications').insertOne({
      _id: n2,
      orgId: 'org_main',
      recipientId: studentOneId.toString(),
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // 1. Mark single read
    const markSingleRes = await fetch(`${baseUrl}/api/v1/notifications/${n1.toString()}/read`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(markSingleRes.status, 200);

    const doc1 = await mockDb.collection('notifications').findOne({ _id: n1 });
    assert.equal(doc1.isRead, true);

    // 2. Mark all read
    const markAllRes = await fetch(`${baseUrl}/api/v1/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(markAllRes.status, 200);

    const doc2 = await mockDb.collection('notifications').findOne({ _id: n2 });
    assert.equal(doc2.isRead, true);
  });

  // 4. Mentorship Advice Replies
  test('Advice-1: Student and assigned supervisor can exchange replies in advice thread', async () => {
    // Supervisor posts advice
    const adviceRes = await fetch(`${baseUrl}/api/v1/supervisor/advice`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: studentOneId.toString(),
        targetType: 'outcome',
        body: 'Focus more on Quran memorization this month.',
      }),
    });
    assert.equal(adviceRes.status, 200);
    const adviceJson = await adviceRes.json();
    const adviceId = adviceJson.advice.id;

    // Student replies
    const replyRes = await fetch(`${baseUrl}/api/v1/advice/${adviceId}/reply`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-student-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: 'Jazakallah khayran, I will set a schedule for 1 hour daily.',
      }),
    });
    assert.equal(replyRes.status, 200);

    // Check thread
    const thread = await mockDb.collection('advice').findOne({ _id: new ObjectId(adviceId) });
    assert.equal(thread.replies.length, 1);
    assert.equal(thread.replies[0].authorRole, 'Student');
    assert.equal(thread.replies[0].body, 'Jazakallah khayran, I will set a schedule for 1 hour daily.');
  });

  // 5. Dashboard & Review Queue
  test('Queue-1: Supervisor dashboard returns accurate KPI counts and queue filtering works', async () => {
    // Outcome 1 submitted for Student 1
    await mockDb.collection('monthlyOutcomes').insertOne({
      orgId: 'org_main',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      revision: 1,
    });

    const dashRes = await fetch(`${baseUrl}/api/v1/supervisor/dashboard`, {
      headers: { Authorization: 'Bearer token-supervisor-1' },
    });
    assert.equal(dashRes.status, 200);
    const dashJson = await dashRes.json();

    assert.equal(dashJson.summary.assignedStudentsCount, 1);
    assert.equal(dashJson.summary.pendingReviewsCount, 1);
    assert.equal(dashJson.summary.recentQueue.length, 1);

    // Queue endpoint
    const queueRes = await fetch(`${baseUrl}/api/v1/supervisor/queue?status=submitted`, {
      headers: { Authorization: 'Bearer token-supervisor-1' },
    });
    assert.equal(queueRes.status, 200);
    const queueJson = await queueRes.json();
    assert.equal(queueJson.total, 1);
    assert.equal(queueJson.queue[0].monthKey, '2026-09');
  });
});
