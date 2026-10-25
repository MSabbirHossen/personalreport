import { Db } from 'mongodb';
import { AuditEvent } from '@reportbd/shared';

export interface LogAuditEventParams {
  orgId: string;
  actorId: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export interface AuditMetrics {
  totalLogged: number;
  totalFailures: number;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
}

// In-memory audit metrics for operational observability
const auditMetrics: AuditMetrics = {
  totalLogged: 0,
  totalFailures: 0,
  lastFailureAt: null,
  lastFailureReason: null,
};

export function getAuditMetrics(): Readonly<AuditMetrics> {
  return { ...auditMetrics };
}

export function resetAuditMetrics(): void {
  auditMetrics.totalLogged = 0;
  auditMetrics.totalFailures = 0;
  auditMetrics.lastFailureAt = null;
  auditMetrics.lastFailureReason = null;
}

const SENSITIVE_KEY_REGEX = /(password|token|secret|credential|key|auth|private|cookie|hash)/i;

/**
 * Recursively sanitizes metadata before persisting to audit storage.
 * Performs deep traversal on nested objects and arrays up to depth 6,
 * redacting sensitive keys and capping string lengths to 256 characters.
 */
export function sanitizeMetadata(value: any, depth = 0): any {
  if (depth > 6) {
    return '[TRUNCATED_DEPTH]';
  }

  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    if (
      value.startsWith('Bearer ') ||
      value.includes('BEGIN PRIVATE KEY') ||
      value.includes('BEGIN RSA PRIVATE KEY')
    ) {
      return '[REDACTED]';
    }
    // Truncate overly long text fields to max 256 chars for audit log efficiency
    return value.length > 256 ? `${value.substring(0, 253)}...` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    // Recursively sanitize array elements (capped at first 50 items)
    return value.slice(0, 50).map((item) => sanitizeMetadata(item, depth + 1));
  }

  if (typeof value === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        const sanitizedVal = sanitizeMetadata(val, depth + 1);
        if (sanitizedVal !== undefined) {
          sanitizedObj[key] = sanitizedVal;
        }
      }
    }
    return sanitizedObj;
  }

  return String(value);
}

/**
 * Appends an application-level immutable, server-timestamped record to the auditEvents collection.
 *
 * Reliability & Tamper-Resistance Notice:
 * - Audit records are generated strictly server-side; ordinary API routes expose NO update or delete endpoints.
 * - Sensitive credentials, tokens, and raw private reports are excluded or deep-redacted before persistence.
 * - If MongoDB write fails, the failure is recorded in operational metrics (`getAuditMetrics`) and logged,
 *   preventing silent log failures without breaking non-critical caller workflows.
 */
export async function logAuditEvent(db: Db, params: LogAuditEventParams): Promise<boolean> {
  try {
    const time = new Date().toISOString();
    const doc: AuditEvent = {
      orgId: params.orgId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      time,
      timestamp: time,
      metadata: sanitizeMetadata(params.metadata),
      ip: params.ip,
      userAgent: params.userAgent ? params.userAgent.substring(0, 200) : undefined,
    };

    await db.collection('auditEvents').insertOne(doc as any);
    auditMetrics.totalLogged += 1;
    return true;
  } catch (err: any) {
    auditMetrics.totalFailures += 1;
    auditMetrics.lastFailureAt = new Date().toISOString();
    auditMetrics.lastFailureReason = err?.message || 'Unknown database write error';
    console.error('❌ [AUDIT_LOG_FAILURE] Failed to record audit event:', {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      error: err?.message,
    });
    return false;
  }
}
