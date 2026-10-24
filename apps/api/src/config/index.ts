import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Strict CORS validation: In production, require explicit origin allowlist.
const rawCorsOrigin = process.env.CORS_ORIGIN || '';
const parsedCorsOrigins: string[] = rawCorsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv,
  isProduction,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/reportbd',
  databaseName: process.env.MONGODB_DB_NAME || 'reportbd',
  cors: {
    raw: rawCorsOrigin,
    allowedOrigins: parsedCorsOrigins,
    // Wildcard is never permitted in production
    isWildcardAllowed: !isProduction && (rawCorsOrigin === '*' || parsedCorsOrigins.length === 0),
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  // Isolated development/test mock auth: STRICTLY forbidden in production
  allowDevMockAuth: !isProduction && process.env.ALLOW_DEV_MOCK_AUTH === 'true',
};

export function validateStartupConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.isProduction) {
    if (!config.firebase.projectId) {
      errors.push('FIREBASE_PROJECT_ID is required in production.');
    }
    if (!config.firebase.clientEmail || !config.firebase.privateKey) {
      errors.push('Firebase Admin credentials (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are required in production.');
    }
    if (config.cors.allowedOrigins.length === 0) {
      errors.push('CORS_ORIGIN must be explicitly configured in production (cannot be empty or wildcard).');
    }
    if (config.cors.allowedOrigins.includes('*')) {
      errors.push('Wildcard "*" CORS origin is forbidden in production with credentialed requests.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
