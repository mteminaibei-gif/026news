/**
 * 026connet! — Demo Account Seeder
 * 
 * Run AFTER you have applied the schema in Supabase SQL Editor:
 *   npx tsx --env-file=.env.local seed.ts
 * 
 * Creates:
 *   admin@026connet!.com      / Admin026!
 *   journalist@026connet!.com / Journalist026!
 *   bot@026connet!.com        / (system user for RSS aggregation)
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

const ACCOUNTS = [
  {
    email:    'admin@026connet!.com',
    password: 'Admin026!',
    name:     'Admin User',
    role:     'admin',
    bio:      'Platform administrator.',
  },
  {
    email:    'journalist@026connet!.com',
    password: 'Journalist026!',
    name:     'Demo Journalist',
    role:     'journalist',
    bio:      'Demo journalist for testing the platform.',
  },
  {
    email:    'bot@026connet!.com',
    password: crypto.randomUUID(), // random — this account is never signed in
    name:     'News Assistant',
    role:     'journalist',
    bio:      'Automated aggregator account for RSS feeds.',
  },
]

async function seed() {
  console.log('🌱 026connet! seed starting...\n')

  for (const account of ACCOUNTS) {
    process.stdout.write(`  Creating ${account.email}... `)

    // 1. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email:             account.email,
      password:          account.password,
      email_confirm:     true,    // skip email verification
    })

    if (authErr) {
      if (authErr.message.includes('already registered') || authErr.message.includes('already been registered')) {
        console.log('⚠️  auth user already exists, upserting profile...')
      } else {
        console.error(`❌  auth error: ${authErr.message}`)
        continue
      }
    }

    const authId = authData?.user?.id

    // 2. Upsert users row
    const { error: profileErr } = await supabase
      .from('users')
      .upsert({
        ...(authId ? { auth_id: authId } : {}),
        email:         account.email,
        name:          account.name,
        role:          account.role as 'admin' | 'journalist',
        bio:           account.bio,
        password_hash: '',
        status:        'active',
      } as never, { onConflict: 'email' })

    if (profileErr) {
      console.error(`❌  profile error: ${profileErr.message}`)
    } else {
      console.log('✅  done')
    }
  }

  // 3. Verify tables by checking category count
  const { data: cats, error: catErr } = await supabase.from('categories').select('name')
  if (catErr) {
    console.error('\n❌  Could not query categories:', catErr.message)
    console.error('    → Have you run the schema SQL in Supabase SQL Editor?')
    process.exit(1)
  }
  console.log(`\n📂  Categories found: ${cats?.length ?? 0}`)
  console.log('    ' + (cats ?? []).map(c => c.name).join(', '))

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Seeding complete!

  Admin:
    email:    admin@026connet!.com
    password: Admin026!
    url:      /admin/dashboard

  Journalist:
    email:    journalist@026connet!.com
    password: Journalist026!
    url:      /journalist/dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

seed().catch(err => { console.error(err); process.exit(1) })
