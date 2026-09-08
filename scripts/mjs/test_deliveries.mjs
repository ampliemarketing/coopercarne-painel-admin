import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrgussbkzdmwvvjydipn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3Vzc2JremRtd3Z2anlkaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTA3ODQsImV4cCI6MjEwMjI4Njc4NH0.KW9NP7MdIgbGQqVNBGTPo4N6Ay9jHz16c0v-wa75siM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeliveries() {
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
      profiles!agendamentos_abate_user_id_fkey (
        id,
        nome,
        perfil,
        estabelecimentos (
          razao_social
        )
      )
    `)
    .is('deleted_at', null)
    .order('data_abate', { ascending: false });

  console.log('Error:', error ? error.message : null);
  console.log('Result count:', data?.length);
  console.log('Rows:', data?.map(r => ({
    id: r.id,
    producer: r.profiles?.nome,
    tipo: r.tipo_animal,
    qtd: r.quantidade,
    data: r.data_abate,
    status: r.status,
  })));
}

testDeliveries();
