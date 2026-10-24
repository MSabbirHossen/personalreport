import { MongoClient, Db } from 'mongodb';
import { config } from '../config/index.js';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export function setTestDb(testDb: Db | null): void {
  cachedDb = testDb;
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedDb) {
    return { client: cachedClient as MongoClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(config.mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    await client.connect();
    const db = client.db(config.databaseName);

    cachedClient = client;
    cachedDb = db;
    console.log('✅ Connected to MongoDB');

    return { client, db };
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

export async function closeDatabase(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
