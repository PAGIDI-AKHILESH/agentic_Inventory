import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== PostgreSQL Database Connectivity Test ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@'));
  console.log('');

  try {
    console.log('Attempting to connect...');
    await prisma.$connect();
    console.log('✅ SUCCESS: Connected to PostgreSQL!\n');

    // Query DB version and info
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        version() as version,
        current_database() as database,
        current_user as user
    `;
    console.log('📊 Database Info:');
    console.log('  Version :', result[0].version);
    console.log('  Database:', result[0].database);
    console.log('  User    :', result[0].user);

    // Check if tables exist (schema applied)
    const tables = await prisma.$queryRaw<any[]>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log(`\n📋 Tables in database (${tables.length} found):`);
    if (tables.length === 0) {
      console.log('  ⚠️  No tables found — you may need to run: npx prisma migrate deploy');
    } else {
      tables.forEach((t: any) => console.log(`  - ${t.tablename}`));
    }

  } catch (err: any) {
    console.log('❌ FAILED: Could not connect to database.\n');
    console.log('Error:', err.message);
    if (err.message?.includes('ENOTFOUND') || err.message?.includes('ECONNREFUSED')) {
      console.log('\n💡 Fix: The database host is not reachable. Update DATABASE_URL in your .env file.');
    } else if (err.message?.includes('password authentication')) {
      console.log('\n💡 Fix: Wrong username or password. Update DATABASE_URL credentials.');
    } else if (err.message?.includes('does not exist')) {
      console.log('\n💡 Fix: Database does not exist. Create it or update DATABASE_URL.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
