/**
 * Supabase Database Setup Script
 * Run this ONCE to create the quiz_submissions table in your Supabase project.
 * 
 * Usage: node setup-db.js
 * 
 * Alternatively, you can run this SQL directly in the Supabase SQL Editor:
 * https://supabase.com → Your Project → SQL Editor
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS quiz_submissions (
    id BIGSERIAL PRIMARY KEY,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT,
    quiz_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage REAL NOT NULL,
    accuracy REAL NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    evaluation_status TEXT NOT NULL,
    answers_json JSONB NOT NULL DEFAULT '[]',
    submitted_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Enable Row Level Security (but allow all operations for anon key)
  ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

  -- Policy: allow all operations for authenticated and anon users
  CREATE POLICY IF NOT EXISTS "Allow all operations" ON quiz_submissions
    FOR ALL USING (true) WITH CHECK (true);
`;

async function setup() {
  console.log('🔧 Setting up Supabase database...');
  console.log(`📡 URL: ${process.env.SUPABASE_URL}`);

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: CREATE_TABLE_SQL });
    
    if (error) {
      console.log('\n⚠️  The RPC method is not available. Please run the SQL manually:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n1. Go to https://supabase.com → Your Project → SQL Editor');
      console.log('2. Click "New Query"');
      console.log('3. Paste and run this SQL:\n');
      console.log(CREATE_TABLE_SQL);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n4. Then run: node server.js');
    } else {
      console.log('✅ Table created successfully!');
    }
  } catch (err) {
    console.log('\n⚠️  Please run the following SQL in Supabase SQL Editor manually:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(CREATE_TABLE_SQL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // Test connection by trying to select from the table
  console.log('\n🧪 Testing connection...');
  const { data, error } = await supabase
    .from('quiz_submissions')
    .select('id')
    .limit(1);

  if (error) {
    console.log('❌ Table not found yet. Please create it using the SQL above.');
    console.log('   Error:', error.message);
  } else {
    console.log('✅ Connection successful! Table "quiz_submissions" is ready.');
    console.log(`   Found ${data.length} existing record(s).`);
    console.log('\n🚀 Run: node server.js');
  }
}

setup().catch(console.error);
