import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const users = [
  { email: 'admin@quizdaw.com', password: 'admin1', username: 'admin', role: 'admin' },
  { email: 'david@quizdaw.com', password: 'david1', username: 'david', role: 'user' },
];

async function seed() {
  for (const u of users) {
    console.log(`Creating user: ${u.username} (${u.email})...`);

    // Check if user already exists by email
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((x) => x.email === u.email);

    if (found) {
      console.log(`  -> Already exists (id: ${found.id}), skipping.`);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { username: u.username, role: u.role },
    });

    if (error) {
      console.error(`  -> ERROR: ${error.message}`);
    } else {
      console.log(`  -> Created (id: ${data.user.id})`);
    }
  }

  console.log('\nDone! Credentials:');
  console.log('  admin@quizdaw.com / admin1  (admin)');
  console.log('  david@quizdaw.com / david1  (user)');
}

seed().catch(console.error);
