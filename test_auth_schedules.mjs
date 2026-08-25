import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrgussbkzdmwvvjydipn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3Vzc2JremRtd3Z2anlkaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTA3ODQsImV4cCI6MjEwMjI4Njc4NH0.KW9NP7MdIgbGQqVNBGTPo4N6Ay9jHz16c0v-wa75siM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithAuth() {
  // Let's sign in as admin or test anon
  const { data: { user }, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@coopercarne.com.br',
    password: 'admin' // or whatever password
  });

  if (authErr) {
    console.log('Admin login error:', authErr.message);
  } else {
    console.log('Logged in as:', user?.email);
  }

  const { data, error } = await supabase.from('agendamentos_abate').select('*');
  console.log('Agendamentos query (auth/anon):', error ? error.message : `${data?.length} records found`);
  if (data && data.length > 0) {
    console.log(data);
  }
}

testWithAuth();
