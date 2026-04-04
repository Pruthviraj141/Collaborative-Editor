import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

async function runTests() {
  console.log('🚀 Starting environment test...\n')

  // 1. Check ENV variables
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL'
  ]

  let missing = false

  for (const key of requiredEnvs) {
    if (!process.env[key]) {
      console.error(`❌ Missing ENV: ${key}`)
      missing = true
    } else {
      console.log(`✅ ${key} loaded`)
    }
  }

  if (missing) {
    console.log('\n❌ Fix missing env variables first')
    process.exit(1)
  }

  // 2. Test Supabase connection
  console.log('\n🔌 Testing Supabase connection...')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Supabase query failed:', error.message)
  } else {
    console.log('✅ Supabase connected successfully')
  }

  // 3. Test Auth (anonymous session check)
  console.log('\n🔐 Testing Auth...')

  const { data: sessionData, error: authError } =
    await supabase.auth.getSession()

  if (authError) {
    console.error('❌ Auth error:', authError.message)
  } else {
    console.log('✅ Auth system reachable')
  }

  // 4. Test PostgreSQL direct connection
  console.log('\n🗄️ Testing Database connection...')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Database connected')

    const res = await client.query('SELECT NOW()')
    console.log('✅ DB query success:', res.rows[0])

    await client.end()
  } catch (err) {
    console.error('❌ Database error:', err.message)
  }

  // 5. Optional: check a table (workspaces)
  console.log('\n📦 Checking "workspaces" table...')

  const { data: workspaceData, error: workspaceError } =
    await supabase.from('workspaces').select('*').limit(1)

  if (workspaceError) {
    console.warn('⚠️ Workspaces table issue:', workspaceError.message)
  } else {
    console.log('✅ Workspaces table accessible')
  }

  console.log('\n🎉 Test completed!\n')
}

runTests()