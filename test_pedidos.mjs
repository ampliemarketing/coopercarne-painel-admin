import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrgussbkzdmwvvjydipn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3Vzc2JremRtd3Z2anlkaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTA3ODQsImV4cCI6MjEwMjI4Njc4NH0.KW9NP7MdIgbGQqVNBGTPo4N6Ay9jHz16c0v-wa75siM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPedidos() {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      codigo,
      user_id,
      status,
      tipo_carne,
      total,
      data_entrega_desejada,
      local_entrega,
      observacoes,
      created_at,
      profiles!pedidos_user_id_fkey (
        nome,
        perfil,
        estabelecimentos (
          razao_social
        )
      ),
      pedido_itens (
        id,
        corte,
        quantidade_kg,
        preco_unitario,
        subtotal
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  console.log('Error:', error ? error.message : null);
  console.log('Pedidos count:', data?.length);
  if (data && data.length > 0) {
    console.log('Sample:', JSON.stringify(data[0], null, 2));
  }
}

testPedidos();
