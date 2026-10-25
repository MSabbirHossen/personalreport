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

const SENSITIVE_KEY_REGEX = /(password|token|secret|credential|key|auth|private)/i;

/**
 * Sanitizes metadata before persisting to audit log.
 * Removes sensitive authentication tokens, passwords, and shrinks large text.
 */
function sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const sanitized: Record<string, any> = {};

  for (const [key, val] of Object.entries(metadata)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (val === null || val === undefined) {
      continue;
    }

    if (typeof val === 'string') {
      // Truncate overly long text fields (e.g. advice bodies or notes) to max 256 chars for audit trail
      sanitized[key] = val.length > 256 ? `${val.substring(0, 253)}...` : val;
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      sanitized[key] = val;
    } else if (Array.isArray(val)) {
      sanitized[key] = `[Array (${val.length} items)]`;
    } else if (typeof val === 'object') {
      // Shallow copy safe primitives
      const subObj: Record<string, any> = {};
      for (const [subK, subV] of Object.entries(val)) {
        if (!SENSITIVE_KEY_REGEX.test(subK) && (typeof subV === 'string' || typeof subV === 'number' || typeof subV === 'boolean')) {
          subObj[subK] = subV;
        }
      }
      sanitized[key] = subObj;
    }
  }

  return sanitized;
}

/**
 * Appends a tamper-resistant, server-timestamped record to the auditEvents collection.
 */
export async function logAuditEvent(db: Db, params: LogAuditEventParams): Promise<void> {
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
  } catch (err) {
    console.error('❌ Failed to log audit event:', err);
  }
}
