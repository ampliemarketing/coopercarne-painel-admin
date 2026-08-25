import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrgussbkzdmwvvjydipn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3Vzc2JremRtd3Z2anlkaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTA3ODQsImV4cCI6MjEwMjI4Njc4NH0.KW9NP7MdIgbGQqVNBGTPo4N6Ay9jHz16c0v-wa75siM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeliveriesQuery() {
  const { data, error } = await supabase
    .from('agendamentos_abate')
    .select(`
      id,
      user_id,
      tipo_animal,
      quantidade,
      data_abate,
      status,
      observacoes,
      created_at,
      profiles (
        nome,
        perfil
      )
    `);

  console.log('Error:', error?.message);
  console.log('Data count:', data?.length);
  console.log('Statuses:', data?.map(d => ({ id: d.id, status: d.status, user: d.profiles?.nome })));
}

testDeliveriesQuery();
