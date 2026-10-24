import { getDb, connectToDatabase } from '../db/mongo.js';
import { DEFAULT_METRIC_GROUPS } from '@reportbd/shared';

export async function initializeDatabase() {
  console.log('🔄 Initializing MongoDB Atlas Collections & Indexes...');
  const { client, db } = await connectToDatabase();

  try {
    // 1. Users collection indexes
    console.log('📌 Creating users indexes...');
    await db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 });

    // 2. Memberships indexes
    console.log('📌 Creating memberships indexes...');
    await db.collection('memberships').createIndex({ orgId: 1, userId: 1 }, { unique: true });
    await db.collection('memberships').createIndex({ orgId: 1, roles: 1 });

    // 3. Daily reports indexes
    console.log('📌 Creating dailyReports indexes...');
    await db.collection('dailyReports').createIndex(
      { orgId: 1, studentId: 1, dateKey: 1 },
      { unique: true }
    );
    await db.collection('dailyReports').createIndex({ orgId: 1, studentId: 1, dateKey: -1 });

    // 4. Monthly plans indexes
    console.log('📌 Creating monthlyPlans indexes...');
    await db.collection('monthlyPlans').createIndex(
      { orgId: 1, studentId: 1, monthKey: 1 },
      { unique: true }
    );

    // 5. Monthly outcomes indexes
    console.log('📌 Creating monthlyOutcomes indexes...');
    await db.collection('monthlyOutcomes').createIndex(
      { orgId: 1, studentId: 1, monthKey: 1 },
      { unique: true }
    );

    // 6. Supervisor assignments indexes
    console.log('📌 Creating supervisorAssignments indexes...');
    await db.collection('supervisorAssignments').createIndex({
      orgId: 1,
      supervisorId: 1,
      status: 1,
    });
    await db.collection('supervisorAssignments').createIndex({
      orgId: 1,
      studentId: 1,
      status: 1,
    });

    // 7. Advice indexes
    console.log('📌 Creating advice indexes...');
    await db.collection('advice').createIndex({ orgId: 1, studentId: 1, createdAt: -1 });

    // 8. Invitations indexes
    console.log('📌 Creating invitations indexes...');
    await db.collection('invitations').createIndex({ token: 1 }, { unique: true });
    await db.collection('invitations').createIndex({ orgId: 1, email: 1, status: 1 });
    await db.collection('invitations').createIndex({ expiresAt: 1 });

    // 8. Template versions indexes & seed default template
    console.log('📌 Setting up default template...');
    await db.collection('templateVersions').createIndex(
      { orgId: 1, templateId: 1, version: 1 },
      { unique: true }
    );

    await db.collection('templateVersions').updateOne(
      { orgId: 'org_default', templateId: 'standard_v1', version: 1 },
      {
        $set: {
          orgId: 'org_default',
          templateId: 'standard_v1',
          version: 1,
          name: 'মানসম্মত রিপোর্ট ফরম্যাট',
          groups: DEFAULT_METRIC_GROUPS,
          isDefault: true,
          publishedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    // 9. Seed default organization
    console.log('📌 Setting up default organization...');
    await db.collection('organizations').updateOne(
      { slug: 'default-org' },
      {
        $set: {
          nameBn: 'বাংলাদেশ কেন্দ্রীয় শাখা',
          nameEn: 'Bangladesh Central Branch',
          slug: 'default-org',
          timezone: 'Asia/Dhaka',
          status: 'active',
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          id: 'org_default',
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    console.log('✅ Database initialized successfully with all collections and indexes!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Allow direct execution: tsx src/scripts/initDb.ts
if (process.argv[1]?.includes('initDb')) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
