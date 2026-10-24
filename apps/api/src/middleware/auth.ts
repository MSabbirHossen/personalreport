import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { config } from '../config/index.js';
import { getDb } from '../db/mongo.js';
import { UserAuthContext, SystemRole } from '@reportbd/shared';

// Initialize Firebase Admin SDK
let firebaseAppInitialized = false;

if (config.firebase.projectId) {
  try {
    if (admin.apps.length > 0) {
      firebaseAppInitialized = true;
    } else if (config.firebase.clientEmail && config.firebase.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });
      firebaseAppInitialized = true;
      console.log('✅ Firebase Admin initialized with service account');
    } else {
      admin.initializeApp({
        projectId: config.firebase.projectId,
      });
      firebaseAppInitialized = true;
      console.log('✅ Firebase Admin initialized with Project ID:', config.firebase.projectId);
    }
  } catch (err) {
    console.warn('⚠️ Firebase Admin init warning:', err);
  }
}

export function isFirebaseInitialized(): boolean {
  return firebaseAppInitialized || admin.apps.length > 0;
}

export interface AuthenticatedRequest extends Request {
  user?: UserAuthContext;
}

/**
 * Token verifier function type (allows injection in unit tests)
 */
export type TokenVerifier = (token: string) => Promise<{ uid: string; email?: string; name?: string }>;

let customTokenVerifier: TokenVerifier | null = null;

export function setCustomTokenVerifier(verifier: TokenVerifier | null): void {
  customTokenVerifier = verifier;
}

/**
 * Primary Authentication Middleware
 * Validates identity and populates user context.
 * Does NOT silently grant roles or assign default organizations.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Missing or malformed Authorization header.',
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Empty authentication token provided.',
    });
    return;
  }

  let firebaseUid = '';
  let email = '';
  let name = '';

  // 1. Verify identity
  try {
    if (customTokenVerifier) {
      // Test-injected verifier
      const verified = await customTokenVerifier(token);
      firebaseUid = verified.uid;
      email = verified.email || '';
      name = verified.name || 'User';
    } else if (token === 'mock-token') {
      // Strictly isolated dev-only mock token: never permitted in production
      if (!config.allowDevMockAuth) {
        res.status(401).json({
          code: 'MOCK_AUTH_DISABLED',
          message: 'Mock authentication is not permitted in this environment.',
        });
        return;
      }
      firebaseUid = 'mock_user_123';
      email = 'student@reportbd.org';
      name = 'Md. Sabbir Hossen';
    } else if (isFirebaseInitialized()) {
      // Standard cryptographic verification via Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(token);
      firebaseUid = decodedToken.uid;
      email = decodedToken.email || '';
      name = (decodedToken as any).name || decodedToken.email?.split('@')[0] || 'User';
    } else {
      // Firebase not configured
      res.status(500).json({
        code: 'AUTH_MISCONFIGURED',
        message: 'Authentication provider is not properly configured.',
      });
      return;
    }
  } catch (tokenErr: any) {
    // Sanitized token verification failure (do not leak internal stack traces)
    res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid, malformed, or expired authentication token.',
    });
    return;
  }

  // 2. Resolve database user and membership (separated from token verification)
  try {
    const db = await getDb();

    // Find or create user record by immutable firebaseUid
    let userRecord = await db.collection('users').findOne({ firebaseUid });
    const now = new Date().toISOString();

    if (!userRecord) {
      const insertResult = await db.collection('users').insertOne({
        firebaseUid,
        email,
        name,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
      userRecord = {
        _id: insertResult.insertedId,
        firebaseUid,
        email,
        name,
        status: 'active',
      };
    }

    // Enforce account status: Reject suspended or disabled accounts
    if (userRecord.status !== 'active') {
      res.status(403).json({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended or deactivated. Contact your administrator.',
      });
      return;
    }

    // Resolve active membership & roles (No silent grant of student or org_default)
    const userId = userRecord._id.toString();
    const membership = await db.collection('memberships').findOne({
      userId,
      status: 'active',
    });

    const roles: SystemRole[] = membership && Array.isArray(membership.roles) ? membership.roles : [];
    const orgId = membership?.orgId || undefined;

    req.user = {
      userId,
      firebaseUid,
      email: userRecord.email || email,
      name: userRecord.name || name,
      orgId,
      roles,
      membership: membership as any,
    };

    next();
  } catch (dbError: any) {
    console.error('Database error in requireAuth:', dbError);
    // Explicitly report database failure as a 503 Service Unavailable, NEVER as an auth/token error
    res.status(503).json({
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database service is currently unavailable. Please retry shortly.',
    });
  }
}

/**
 * Middleware: Requires the user to have an active organization membership.
 * Protects organization-scoped resources from unassigned or external identities.
 */
export function requireActiveMembership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  if (!req.user.orgId || !req.user.membership || req.user.roles.length === 0) {
    res.status(403).json({
      code: 'NO_ACTIVE_MEMBERSHIP',
      message: 'You do not have an active organization membership. Please accept an invitation first.',
    });
    return;
  }

  next();
}

/**
 * Middleware: Requires the user to hold at least one of the specified roles.
 */
export function requireRole(allowedRoles: SystemRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
      });
      return;
    }

    next();
  };
}
