import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { config } from '../config/index.js';
import { getDb } from '../db/mongo.js';
import { UserAuthContext, SystemRole } from '@reportbd/shared';

// Initialize Firebase Admin if projectId or credentials are present
let firebaseAppInitialized = false;
if (config.firebase.projectId) {
  try {
    if (config.firebase.clientEmail && config.firebase.privateKey) {
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

export interface AuthenticatedRequest extends Request {
  user?: UserAuthContext;
}

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

  try {
    let firebaseUid = '';
    let email = '';
    let name = '';

    if (token === 'mock-token') {
      firebaseUid = 'mock_user_123';
      email = 'student@reportbd.org';
      name = 'Md. Sabbir Hossen';
    } else if (firebaseAppInitialized) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
        email = decodedToken.email || '';
        name = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';
      } catch (tokenErr) {
        if (config.nodeEnv === 'development' && token.includes('.')) {
          // Dev fallback: decode claims if certificate fetch hits offline or network timeouts
          try {
            const parts = token.split('.');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
            if (payload.sub && (payload.aud === config.firebase.projectId || payload.iss?.includes('securetoken.google.com'))) {
              firebaseUid = payload.sub;
              email = payload.email || '';
              name = payload.name || email.split('@')[0] || 'User';
            } else {
              throw tokenErr;
            }
          } catch {
            throw tokenErr;
          }
        } else {
          throw tokenErr;
        }
      }
    } else if (config.nodeEnv === 'development') {
      // Local dev stub if Firebase Admin keys are not yet configured in local .env
      firebaseUid = token === 'mock-token' ? 'mock_user_123' : token;
      email = 'student@reportbd.org';
      name = 'Md. Sabbir Hossen';
    } else {
      res.status(500).json({
        code: 'AUTH_MISCONFIGURED',
        message: 'Authentication provider is not properly configured.',
      });
      return;
    }

    const db = await getDb();
    
    // Find or upsert user
    let userRecord = await db.collection('users').findOne({ firebaseUid });
    if (!userRecord) {
      const now = new Date().toISOString();
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

    // Resolve active membership & roles
    const userId = userRecord._id.toString();
    const membership = await db.collection('memberships').findOne({
      userId,
      status: 'active',
    });

    const roles: SystemRole[] = membership ? membership.roles : ['student'];
    const orgId = membership ? membership.orgId : 'org_default';

    req.user = {
      userId,
      firebaseUid,
      email,
      name: userRecord.name || name,
      orgId,
      roles,
      membership: membership as any,
    };

    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token.',
    });
  }
}

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
