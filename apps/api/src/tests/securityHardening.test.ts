import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import express, { Request, Response } from 'express';
import { sanitizeMetadata, logAuditEvent, getAuditMetrics, resetAuditMetrics } from '../services/audit.js';
import { createRateLimiter, clearRateLimits } from '../middleware/rateLimiter.js';
import { errorHandler } from '../middleware/errorHandler.js';

describe('Security Hardening & Protection Tests (Stage 1 & 2)', () => {
  describe('Audit Trail Deep Recursive Redaction & Observability', () => {
    beforeEach(() => {
      resetAuditMetrics();
    });

    test('Sec-1: sanitizeMetadata deeply redacts sensitive keys in nested objects and arrays', () => {
      const input = {
        eventName: 'user_onboarded',
        user: {
          username: 'student1',
          details: {
            token: 'eyJhbGciOi...',
            privateKey: 'SECRET_KEY_DATA',
            safeNote: 'regular text',
          },
        },
        items: [
          { id: 1, authToken: 'SENSITIVE_BEARER' },
          { id: 2, passwordHash: 'HASH_VALUE' },
          { id: 3, safeField: 'visible' },
        ],
      };

      const sanitized = sanitizeMetadata(input);

      assert.equal(sanitized.eventName, 'user_onboarded');
      assert.equal(sanitized.user.username, 'student1');
      assert.equal(sanitized.user.details.token, '[REDACTED]');
      assert.equal(sanitized.user.details.privateKey, '[REDACTED]');
      assert.equal(sanitized.user.details.safeNote, 'regular text');
      assert.equal(sanitized.items[0].authToken, '[REDACTED]');
      assert.equal(sanitized.items[1].passwordHash, '[REDACTED]');
      assert.equal(sanitized.items[2].safeField, 'visible');
    });

    test('Sec-2: sanitizeMetadata truncates strings > 256 characters and bounds deep recursion', () => {
      const longString = 'A'.repeat(300);
      const sanitizedString = sanitizeMetadata(longString);
      assert.equal(sanitizedString.length, 256);
      assert.ok(sanitizedString.endsWith('...'));

      // Test deep recursion > 6
      let deepObj: any = { value: 'leaf' };
      for (let i = 0; i < 8; i++) {
        deepObj = { nested: deepObj };
      }
      const sanitizedDeep = sanitizeMetadata(deepObj);
      assert.ok(JSON.stringify(sanitizedDeep).includes('[TRUNCATED_DEPTH]'));
    });

    test('Sec-3: logAuditEvent records failure in audit metrics without crashing the application', async () => {
      // Mock DB that fails on insertOne
      const failingDb: any = {
        collection: () => ({
          insertOne: async () => {
            throw new Error('Connection timeout to primary cluster');
          },
        }),
      };

      const result = await logAuditEvent(failingDb, {
        orgId: 'org_test',
        actorId: 'admin_1',
        action: 'invitation.created',
        entityType: 'invitation',
        entityId: 'inv_fail_1',
        metadata: { token: 'secret' },
      });

      assert.equal(result, false, 'Failed audit log should return false');
      const metrics = getAuditMetrics();
      assert.equal(metrics.totalFailures, 1);
      assert.ok(metrics.lastFailureAt);
      assert.equal(metrics.lastFailureReason, 'Connection timeout to primary cluster');
    });

    test('Sec-4: logAuditEvent records success in audit metrics on successful persistence', async () => {
      const savedDocs: any[] = [];
      const successfulDb: any = {
        collection: () => ({
          insertOne: async (doc: any) => {
            savedDocs.push(doc);
            return { insertedId: 'audit_ok_1' };
          },
        }),
      };

      const result = await logAuditEvent(successfulDb, {
        orgId: 'org_test',
        actorId: 'admin_1',
        action: 'invitation.created',
        entityType: 'invitation',
        entityId: 'inv_ok_1',
        metadata: { safeEmail: 'user@test.com' },
      });

      assert.equal(result, true);
      assert.equal(savedDocs.length, 1);
      assert.equal(savedDocs[0].metadata?.safeEmail, 'user@test.com');
      const metrics = getAuditMetrics();
      assert.equal(metrics.totalLogged, 1);
      assert.equal(metrics.totalFailures, 0);
    });
  });

  describe('Rate Limiting & Abuse Protection', () => {
    let server: Server;
    let baseUrl: string;

    before(async () => {
      clearRateLimits();
      const testApp = express();
      testApp.use(express.json());

      const customLimiter = createRateLimiter({
        windowMs: 1000,
        max: 3,
        message: 'Rate limit exceeded.',
        skipInTest: false,
        keyGenerator: () => 'fixed_test_key',
      });

      testApp.get('/test-rate-limit', customLimiter, (_req: Request, res: Response) => {
        res.json({ success: true });
      });

      await new Promise<void>((resolve) => {
        server = testApp.listen(0, () => {
          const addr: any = server.address();
          baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });
    });

    after(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      clearRateLimits();
    });

    test('Sec-5: Rate limiter permits requests up to max and adds standard RateLimit-* headers', async () => {
      clearRateLimits();

      // Request 1
      const res1 = await fetch(`${baseUrl}/test-rate-limit`);
      assert.equal(res1.status, 200);
      assert.equal(res1.headers.get('RateLimit-Limit'), '3');
      assert.equal(res1.headers.get('RateLimit-Remaining'), '2');

      // Request 2
      const res2 = await fetch(`${baseUrl}/test-rate-limit`);
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('RateLimit-Remaining'), '1');

      // Request 3
      const res3 = await fetch(`${baseUrl}/test-rate-limit`);
      assert.equal(res3.status, 200);
      assert.equal(res3.headers.get('RateLimit-Remaining'), '0');

      // Request 4 (Must be blocked with HTTP 429)
      const res4 = await fetch(`${baseUrl}/test-rate-limit`);
      assert.equal(res4.status, 429);
      assert.ok(res4.headers.get('Retry-After'));
      const body4: any = await res4.json();
      assert.equal(body4.code, 'TOO_MANY_REQUESTS');
    });
  });

  describe('Input Protection & Error Response Sanitization', () => {
    let server: Server;
    let baseUrl: string;

    before(async () => {
      const testApp = express();
      testApp.use(express.json({ limit: '100kb' }));

      testApp.post('/test-json', (req: Request, res: Response) => {
        res.json({ received: req.body });
      });

      testApp.get('/test-500', () => {
        const err = new Error('Database password was postgres_root_secret');
        (err as any).statusCode = 500;
        throw err;
      });

      testApp.use(errorHandler);

      await new Promise<void>((resolve) => {
        server = testApp.listen(0, () => {
          const addr: any = server.address();
          baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });
    });

    after(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    test('Sec-6: Malformed JSON payload returns clean 400 BAD_REQUEST without stack trace', async () => {
      const res = await fetch(`${baseUrl}/test-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalidJson": unquoted_value}',
      });

      assert.equal(res.status, 400);
      const data: any = await res.json();
      assert.equal(data.code, 'BAD_REQUEST');
      assert.equal(data.message, 'Malformed JSON payload.');
      assert.equal(data.stack, undefined);
    });

    test('Sec-7: Valid JSON payload is parsed and handled normally', async () => {
      const res = await fetch(`${baseUrl}/test-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: true, number: 42 }),
      });

      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.received.number, 42);
    });
  });
});
