const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20240710000000_region_prioritization.sql');

// Use the database URL from the environment; never hardcode credentials.
const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('[run_migration] Set SUPABASE_DB_URL (or DATABASE_URL) in your environment. Refusing to run with a hardcoded password.');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: true
  });

  try {
    await client.connect();
    console.log('Connected to Supabase database successfully!');

    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);
    console.log('');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const stmt of statements) {
      try {
        await client.query(stmt);
        const display = stmt.substring(0, 65) + (stmt.length > 65 ? '...' : '');
        console.log('✓ ' + display);
        successCount++;
      } catch (err) {
        if (err.code === '42710' || err.code === '42P07' || err.code === '42704') {
          const display = stmt.substring(0, 65) + (stmt.length > 65 ? '...' : '');
          console.log('→ Skipped (already exists): ' + display);
          skipCount++;
        } else {
          console.error('✗ Error:', err.message);
          console.error('  Statement:', stmt.substring(0, 80));
          errorCount++;
        }
      }
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('Migration Summary:');
    console.log(`  ✓ Executed: ${successCount}`);
    console.log(`  → Skipped: ${skipCount}`);
    console.log(`  ✗ Errors: ${errorCount}`);
    console.log('='.repeat(50));
    
    // Verify new tables were created
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('regions', 'user_regions', 'article_regions')
      ORDER BY table_name
    `);
    
    console.log('');
    console.log('New tables created:');
    tables.forEach(t => console.log('  - ' + t.table_name));
    
  } catch (err) {
    console.error('Connection error:', err.message);
    console.error('');
    console.error('Check SUPABASE_DB_URL / DATABASE_URL and your network access to the database.');
    console.error('To get the correct connection string:');
    console.error('1. Go to https://dvvbafgpluxvaieguiwm.supabase.co');
    console.error('2. Navigate to Settings → Database');
    console.error('3. Copy the "Connection string" (use pooler mode)');
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
