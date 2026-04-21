#!/usr/bin/env node

/**
 * Migration Runner - Executes Supabase migrations
 * Usage: node run-migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://izqnihdzkirynwlxcysn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
  console.error('Please set it to your Supabase service role key before running this migration.');
  console.error('\nYou can find it at: https://app.supabase.com/project/[PROJECT_ID]/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting migration...\n');
    
    const migrationPath = path.join(__dirname, 'supabase_migrations_001_init.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split by statements, filtering out empty lines and comments
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      try {
        console.log(`[${i + 1}/${statements.length}] Executing...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If the RPC function doesn't exist, try using the REST API directly
          if (error.message.includes('exec_sql')) {
            console.log('⚠️  Using direct REST API (RPC not available)...\n');
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({ query: statement }),
            });
            
            if (!response.ok) {
              throw new Error(`SQL Error: ${await response.text()}`);
            }
          } else {
            throw error;
          }
        }
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`);
        console.error(`   ${statement.substring(0, 100)}...`);
        console.error(`   Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('✅ All database tables have been created with RLS policies.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Run the migration manually:');
    console.error('   1. Go to https://app.supabase.com/project/[PROJECT_ID]/sql');
    console.error('   2. Create a new query');
    console.error('   3. Copy the contents of supabase_migrations_001_init.sql');
    console.error('   4. Paste and click Run\n');
    process.exit(1);
  }
}

runMigration();
