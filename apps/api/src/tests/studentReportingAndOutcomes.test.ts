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
    const results = this.docs.filter((d) => this.matchQuery(d, query));
    return {
      toArray: async () => JSON.parse(JSON.stringify(results)),
      sort: (sortSpec: any = {}) => {
        const sorted = [...results].sort((a, b) => {
          for (const k of Object.keys(sortSpec)) {
            if (a[k] < b[k]) return sortSpec[k] === 1 ? -1 : 1;
            if (a[k] > b[k]) return sortSpec[k] === 1 ? 1 : -1;
          }
          return 0;
        });
        return {
          toArray: async () => JSON.parse(JSON.stringify(sorted)),
        };
      },
    };
  }

  async insertOne(doc: any): Promise<{ insertedId: ObjectId }> {
    // Check unique index constraints
    for (const fields of this.uniqueIndexes) {
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
      if (name === 'dailyReports') {
        this.collections[name].addUniqueIndex(['orgId', 'studentId', 'dateKey']);
      }
      if (name === 'monthlyPlans') {
        this.collections[name].addUniqueIndex(['orgId', 'studentId', 'monthKey']);
      }
      if (name === 'monthlyOutcomes') {
        this.collections[name].addUniqueIndex(['orgId', 'studentId', 'monthKey']);
      }
    }
    return this.collections[name];
  }

  async command(cmd: any): Promise<any> {
    if (cmd.ping) return { ok: 1 };
    return {};
  }
}

describe('Student Reporting, Monthly Outcomes & Snapshot Integrity (Phase 3)', () => {
  let server: Server;
  let baseUrl: string;
  let mockDb: MockDb;

  const studentOneId = new ObjectId();
  const studentTwoId = new ObjectId();
  const supervisorId = new ObjectId();
  const unassignedSupervisorId = new ObjectId();

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

    // Seed Users
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
      _id: supervisorId,
      firebaseUid: 'uid_supervisor_1',
      name: 'Ustadh Mahmud',
      email: 'mahmud@reportbd.org',
      status: 'active',
    });

    await mockDb.collection('users').insertOne({
      _id: unassignedSupervisorId,
      firebaseUid: 'uid_supervisor_2',
      name: 'Ustadh Bilal',
      email: 'bilal@reportbd.org',
      status: 'active',
    });

    // Seed Memberships
    await mockDb.collection('memberships').insertOne({
      userId: studentOneId.toString(),
      orgId: 'org_main',
      roles: ['student'],
      status: 'active',
    });

    await mockDb.collection('memberships').insertOne({
      userId: studentTwoId.toString(),
      orgId: 'org_main',
      roles: ['student'],
      status: 'active',
    });

    await mockDb.collection('memberships').insertOne({
      userId: supervisorId.toString(),
      orgId: 'org_main',
      roles: ['supervisor'],
      status: 'active',
    });

    await mockDb.collection('memberships').insertOne({
      userId: unassignedSupervisorId.toString(),
      orgId: 'org_main',
      roles: ['supervisor'],
      status: 'active',
    });

    // Supervisor 1 is actively assigned to Student 1
    await mockDb.collection('supervisorAssignments').insertOne({
      orgId: 'org_main',
      supervisorId: supervisorId.toString(),
      studentId: studentOneId.toString(),
      status: 'active',
      startAt: new Date().toISOString(),
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
        return { uid: 'uid_supervisor_1', email: 'mahmud@reportbd.org', name: 'Ustadh Mahmud' };
      }
      if (token === 'token-supervisor-2') {
        return { uid: 'uid_supervisor_2', email: 'bilal@reportbd.org', name: 'Ustadh Bilal' };
      }
      throw new Error('Invalid token');
    });
  });

  // ==================== STAGE 1: DAILY REPORTING & CONCURRENCY ====================

  test('Daily-1: Create a daily report and retrieve it with revision=1', async () => {
    const putRes = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-01`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer token-student-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: {
          quran_study_ayat: 20,
          quran_recitation_minutes: 30,
          salah_jamaat_count: 5,
        },
      }),
    });

    assert.equal(putRes.status, 200);
    const putJson = await putRes.json();
    assert.equal(putJson.success, true);
    assert.equal(putJson.report.revision, 1);
    assert.equal(putJson.report.status, 'saved');
    assert.equal(putJson.report.values.quran_study_ayat, 20);

    // Retrieve via GET /daily-reports/:date
    const getRes = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-01`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.equal(getJson.dateKey, '2026-09-01');
    assert.equal(getJson.revision, 1);
    assert.equal(getJson.values.quran_study_ayat, 20);
    assert.ok(getJson.createdAt, 'Report must contain authoritative createdAt timestamp');
    assert.ok(getJson.updatedAt, 'Report must contain authoritative updatedAt timestamp');
  });

  test('Daily-1B: Server validation strictly rejects negative numeric values', async () => {
    const putRes = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-02`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer token-student-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: {
          quran_study_ayat: -10,
        },
      }),
    });

    assert.equal(putRes.status, 400);
    const putJson = await putRes.json();
    assert.equal(putJson.code, 'VALIDATION_ERROR');
    assert.ok(putJson.message.includes('Negative values are not permitted'));
  });

  test('Daily-2: Update existing daily report increments revision and creates revision audit log', async () => {
    // Initial save (revision 1)
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-01`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 10 }, revision: 0 }),
    });

    // Update (correction) with revision 1 -> increments to 2
    const updateRes = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-01`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: { quran_study_ayat: 25 },
        revision: 1,
        reason: 'Recounted morning study',
      }),
    });

    assert.equal(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.equal(updateJson.report.revision, 2);
    assert.equal(updateJson.report.status, 'corrected');
    assert.equal(updateJson.report.values.quran_study_ayat, 25);

    // Verify audit log created in dailyReportRevisions
    const revLogsRes = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-01/revisions`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(revLogsRes.status, 200);
    const revLogsJson = await revLogsRes.json();
    assert.equal(revLogsJson.revisions.length, 1);
    assert.equal(revLogsJson.revisions[0].oldValues.quran_study_ayat, 10);
    assert.equal(revLogsJson.revisions[0].newValues.quran_study_ayat, 25);
    assert.equal(revLogsJson.revisions[0].reason, 'Recounted morning study');
  });

  test('Daily-3: Reject an update using a stale revision with 409 CONFLICT', async () => {
    // Save report twice so server revision is 2
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-02`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 10 } }),
    });
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-02`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 20 }, revision: 1 }),
    });

    // Client sends stale revision 1 when server is at 2
    const staleRes = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-02`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 999 }, revision: 1 }),
    });

    assert.equal(staleRes.status, 409);
    const staleJson = await staleRes.json();
    assert.equal(staleJson.code, 'CONFLICT');
    assert.equal(staleJson.serverRevision, 2);
  });

  test('Daily-4: Stale update rejection does not overwrite latest saved values', async () => {
    // Initial save -> revision 1
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-03`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 15 } }),
    });

    // Second valid update -> revision 2
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-03`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 30 }, revision: 1 }),
    });

    // Stale update attempt with revision 1
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-03`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 0 }, revision: 1 }),
    });

    // Verify database still holds authoritative revision 2 values
    const getRes = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-03`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    const getJson = await getRes.json();
    assert.equal(getJson.revision, 2);
    assert.equal(getJson.values.quran_study_ayat, 30);
  });

  test('Daily-5: Distinguishes missing values from explicit numeric zero', async () => {
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-04`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: {
          quran_study_ayat: 0, // Explicit zero
          hadith_study_count: null, // Missing / unanswered
        },
      }),
    });

    const getRes = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-04`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    const getJson = await getRes.json();
    assert.strictEqual(getJson.values.quran_study_ayat, 0);
    assert.strictEqual(getJson.values.hadith_study_count, null);
    assert.strictEqual(getJson.values.salah_jamaat_count, undefined);
  });

  // ==================== STAGE 2: MONTHLY PLANNING ====================

  test('Plan-1: Create and reload monthly plan with revision tracking', async () => {
    const saveRes = await fetch(`${baseUrl}/api/v1/monthly-plans/2026-09`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targets: {
          quran_study_ayat: 500,
          hadith_study_count: 50,
        },
        notes: 'Targeting 20 pages per day in study',
      }),
    });

    assert.equal(saveRes.status, 200);
    const saveJson = await saveRes.json();
    assert.equal(saveJson.plan.revision, 1);
    assert.equal(saveJson.plan.status, 'draft');

    // Retrieve via GET /monthly-plans/:month
    const getRes = await fetch(`${baseUrl}/api/v1/monthly-plans/2026-09`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.equal(getJson.monthKey, '2026-09');
    assert.equal(getJson.targets.quran_study_ayat, 500);
    assert.equal(getJson.revision, 1);
  });

  test('Plan-2: Stale monthly plan revision rejected with 409 CONFLICT', async () => {
    // Initial save (revision 1)
    await fetch(`${baseUrl}/api/v1/monthly-plans/2026-09`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: { quran_study_ayat: 100 } }),
    });

    // Second save (revision 2)
    await fetch(`${baseUrl}/api/v1/monthly-plans/2026-09`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: { quran_study_ayat: 200 }, revision: 1 }),
    });

    // Stale update attempt with revision 1
    const conflictRes = await fetch(`${baseUrl}/api/v1/monthly-plans/2026-09`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: { quran_study_ayat: 999 }, revision: 1 }),
    });

    assert.equal(conflictRes.status, 409);
    const conflictJson = await conflictRes.json();
    assert.equal(conflictJson.code, 'CONFLICT');
    assert.equal(conflictJson.serverRevision, 2);
  });

  test('Plan-3: Student shares plan with supervisor', async () => {
    await fetch(`${baseUrl}/api/v1/monthly-plans/2026-09`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: { quran_study_ayat: 300 } }),
    });

    const shareRes = await fetch(`${baseUrl}/api/v1/monthly-plans/2026-09/share`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });

    assert.equal(shareRes.status, 200);
    const getRes = await fetch(`${baseUrl}/api/v1/monthly-plans/2026-09`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    const getJson = await getRes.json();
    assert.equal(getJson.status, 'shared');
    assert.ok(getJson.sharedAt);
  });

  // ==================== STAGE 3 & 4: MONTHLY OUTCOMES & SNAPSHOT INTEGRITY ====================

  test('Outcome-1: Submit monthly outcome captures immutable snapshot', async () => {
    // 1. Create daily entries for 2026-09
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-01`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 15, salah_jamaat_count: 5 } }),
    });
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-02`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 25, salah_jamaat_count: 5 } }),
    });

    // 2. Save outcome draft (manual reflections)
    await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        manualValues: {},
        reflections: {
          achievements: 'Completed first 2 juz',
          challenges: 'Late waking up',
        },
      }),
    });

    // 3. Submit outcome
    const submitRes = await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09/submit`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });

    assert.equal(submitRes.status, 200);
    const submitJson = await submitRes.json();
    assert.equal(submitJson.success, true);
    assert.ok(submitJson.snapshot);
    assert.equal(submitJson.snapshot.derivedValues.quran_study_ayat, 40); // 15 + 25 = 40
    assert.equal(submitJson.snapshot.dailyReportsCount, 2);

    // Retrieve via GET
    const getRes = await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    const getJson = await getRes.json();
    assert.equal(getJson.status, 'submitted');
    assert.equal(getJson.derivedValues.quran_study_ayat, 40);
    assert.equal(getJson.isStale, false);
    assert.ok(getJson.submittedAt);
  });

  test('Outcome-2: Snapshot immutability & Stale detection on subsequent daily edits', async () => {
    // 1. Student saves and submits for 2026-09
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-10`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 30 } }),
    });
    await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09/submit`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });

    // Verify snapshot derived value is 30
    const beforeEditRes = await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    const beforeEditJson = await beforeEditRes.json();
    assert.equal(beforeEditJson.derivedValues.quran_study_ayat, 30);
    assert.equal(beforeEditJson.isStale, false);

    // 2. Student edits daily report AFTER submission (changing value to 100)
    const editDailyRes = await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-10`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 100 }, revision: 1 }),
    });
    assert.equal(editDailyRes.status, 200);

    // 3. Verify monthly outcome:
    // A. Submitted snapshot MUST BE UNCHANGED (still 30, not 100!)
    // B. isStale MUST BE TRUE with staleReason recorded!
    const afterEditRes = await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    const afterEditJson = await afterEditRes.json();

    assert.equal(afterEditJson.derivedValues.quran_study_ayat, 30); // Preserved snapshot!
    assert.equal(afterEditJson.liveDerivedValues.quran_study_ayat, 100); // Live daily aggregate
    assert.equal(afterEditJson.isStale, true);
    assert.match(afterEditJson.staleReason, /2026-09-10 was updated after submission/);
  });

  test('Outcome-3: Edits to unrelated month daily reports do NOT mark submitted outcome stale', async () => {
    // Submit 2026-09 outcome
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-01`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 50 } }),
    });
    await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09/submit`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });

    // Edit daily report in DIFFERENT month (2026-08)
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-08-15`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 99 } }),
    });

    // 2026-09 outcome must NOT be marked stale!
    const res = await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    const json = await res.json();
    assert.equal(json.isStale, false);
    assert.equal(json.derivedValues.quran_study_ayat, 50);
  });

  test('Outcome-4: Cannot edit outcome draft or submit again when already submitted', async () => {
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-01`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 10 } }),
    });
    await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09/submit`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });

    // Attempt PUT /monthly-outcomes/:month while submitted -> 400 IMMUTABLE_OUTCOME
    const editRes = await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ manualValues: { test: 123 } }),
    });
    assert.equal(editRes.status, 400);
    const editJson = await editRes.json();
    assert.equal(editJson.code, 'IMMUTABLE_OUTCOME');

    // Attempt second submit -> 400 INVALID_STATE_TRANSITION
    const reSubmitRes = await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09/submit`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(reSubmitRes.status, 400);
    const reSubmitJson = await reSubmitRes.json();
    assert.equal(reSubmitJson.code, 'INVALID_STATE_TRANSITION');
  });

  // ==================== STAGE 5 & 6: SUPERVISOR REVIEW & RETURN LIFECYCLE ====================

  test('Review-1: Assigned supervisor reviews submitted outcome and acknowledges it', async () => {
    // 1. Student submits outcome
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-01`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 100 } }),
    });
    await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09/submit`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });

    const studentOutcome = await mockDb.collection('monthlyOutcomes').findOne({
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
    });

    // 2. Assigned supervisor reviews and acknowledges
    const reviewRes = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${studentOutcome._id.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: studentOutcome._id.toString(),
        action: 'acknowledge',
        feedback: 'Excellent consistency in Quran study!',
      }),
    });

    assert.equal(reviewRes.status, 200);
    const updatedOutcome = await mockDb.collection('monthlyOutcomes').findOne({ _id: studentOutcome._id });
    assert.equal(updatedOutcome.status, 'acknowledged');
    assert.ok(updatedOutcome.reviewedAt);
    assert.equal(updatedOutcome.reviewedBy, supervisorId.toString());

    // Advice entry should be created automatically
    const adviceDoc = await mockDb.collection('advice').findOne({
      studentId: studentOneId.toString(),
      targetId: studentOutcome._id.toString(),
    });
    assert.ok(adviceDoc);
    assert.equal(adviceDoc.body, 'Excellent consistency in Quran study!');
  });

  test('Review-2: Supervisor returns report, student modifies and resubmits', async () => {
    // 1. Student submits outcome
    await fetch(`${baseUrl}/api/v1/daily-reports/2026-09-01`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { quran_study_ayat: 20 } }),
    });
    await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09/submit`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });

    const studentOutcome = await mockDb.collection('monthlyOutcomes').findOne({
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
    });

    // 2. Supervisor returns the report requesting more reflection
    const returnRes = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${studentOutcome._id.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: studentOutcome._id.toString(),
        action: 'return',
        feedback: 'Please write your reflections on challenges before final approval.',
      }),
    });
    assert.equal(returnRes.status, 200);

    // 3. Student outcome is now 'returned'
    const getRes = await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09`, {
      headers: { Authorization: 'Bearer token-student-1' },
    });
    const getJson = await getRes.json();
    assert.equal(getJson.status, 'returned');

    // 4. Student can now edit draft again
    const updateRes = await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer token-student-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        revision: getJson.revision,
        reflections: { challenges: 'Faced time management issues with college exams' },
      }),
    });
    assert.equal(updateRes.status, 200);

    // 5. Student re-submits report
    const resubmitRes = await fetch(`${baseUrl}/api/v1/monthly-outcomes/2026-09/submit`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-student-1' },
    });
    assert.equal(resubmitRes.status, 200);

    const finalOutcome = await mockDb.collection('monthlyOutcomes').findOne({ _id: studentOutcome._id });
    assert.equal(finalOutcome.status, 'submitted');
    assert.equal(finalOutcome.reflections.challenges, 'Faced time management issues with college exams');
  });

  test('Review-3: Supervisor cannot review unsubmitted draft report', async () => {
    // Draft outcome (not submitted)
    await mockDb.collection('monthlyOutcomes').insertOne({
      orgId: 'org_main',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'draft',
      derivedValues: {},
    });

    const draftOutcome = await mockDb.collection('monthlyOutcomes').findOne({
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
    });

    const res = await fetch(`${baseUrl}/api/v1/supervisor/reviews/${draftOutcome._id.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-supervisor-1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outcomeId: draftOutcome._id.toString(),
        action: 'acknowledge',
      }),
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, 'INVALID_STATUS');
  });

  test('Review-4: Supervisor can view student reports via GET /supervisor/students/:id/reports', async () => {
    await mockDb.collection('monthlyOutcomes').insertOne({
      orgId: 'org_main',
      studentId: studentOneId.toString(),
      monthKey: '2026-09',
      status: 'submitted',
      derivedValues: { quran_study_ayat: 75 },
    });

    const res = await fetch(`${baseUrl}/api/v1/supervisor/students/${studentOneId.toString()}/reports`, {
      headers: { Authorization: 'Bearer token-supervisor-1' },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.reports.length, 1);
    assert.equal(json.reports[0].monthKey, '2026-09');
    assert.equal(json.reports[0].status, 'submitted');

    // Unassigned supervisor is rejected with 403
    const unassignedRes = await fetch(`${baseUrl}/api/v1/supervisor/students/${studentOneId.toString()}/reports`, {
      headers: { Authorization: 'Bearer token-supervisor-2' },
    });
    assert.equal(unassignedRes.status, 403);
  });
});
