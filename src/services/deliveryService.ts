import { supabase, isSupabaseReady } from '../lib/supabase';
import type { DeliverySchedule } from '../types';

export const deliveryService = {
  /**
   * Busca a lista de entregas e carcaças liberadas a partir dos agendamentos de abate
   */
  async getDeliveries(): Promise<DeliverySchedule[]> {
    if (!isSupabaseReady()) return [];

    try {
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
          updated_at,
          profiles!agendamentos_abate_user_id_fkey (
            nome,
            perfil,
            estabelecimentos (
              razao_social
            )
          )
        `)
        .in('status', ['recebido_curral', 'em_abate', 'concluido'])
        .is('deleted_at', null)
        .order('data_abate', { ascending: false });

      if (error) {
        console.error('[deliveryService] Erro ao buscar entregas:', error.message);
        throw error;
      }

      const rows = data || [];
      return rows.map((row: any) => {
        const prof = row.profiles;
        const estab = prof?.estabelecimentos;
        const producerName = prof?.nome || estab?.razao_social || 'Produtor COOPERCARNE';
        const isConcluido = row.status === 'concluido';
        const obs = row.observacoes || '';

        const carcassDelivered = isConcluido || obs.includes('CARCACA_ENTREGUE');
        const heartDelivered = isConcluido || obs.includes('CORACAO_ENTREGUE');
        const liverDelivered = isConcluido || obs.includes('FIGADO_ENTREGUE');

        return {
          id: row.id,
          userId: row.user_id,
          userName: producerName,
          deliveryDate: row.data_abate,
          carcassDelivered,
          heartDelivered,
          liverDelivered,
          notes: obs.replace(/CARCACA_ENTREGUE|CORACAO_ENTREGUE|FIGADO_ENTREGUE/g, '').trim(),
          status: isConcluido ? 'concluido' : 'agendado',
        };
      });
    } catch (err) {
      console.error('[deliveryService] Erro getDeliveries:', err);
      throw err;
    }
  },

  /**
   * Dá baixa na entrega (libera carcaça/miúdos e libera o espaço correspondente na câmara fria)
   */
  async updateDeliveryItem(
    deliveryId: string,
    itemType: 'carcass' | 'heart' | 'liver',
    delivered: boolean,
    adminId?: string
  ): Promise<void> {
    const { data: schedule } = await supabase
      .from('agendamentos_abate')
      .select('status, observacoes, tipo_animal, quantidade, data_abate')
      .eq('id', deliveryId)
      .single();

    let obs = schedule?.observacoes || '';
    const flag = itemType === 'carcass' ? 'CARCACA_ENTREGUE' : itemType === 'heart' ? 'CORACAO_ENTREGUE' : 'FIGADO_ENTREGUE';

    if (delivered && !obs.includes(flag)) {
      obs = `${obs} ${flag}`.trim();
    } else if (!delivered && obs.includes(flag)) {
      obs = obs.replace(flag, '').trim();
    }

    // Se todos os itens foram entregues, marca como concluído
    const allDelivered = obs.includes('CARCACA_ENTREGUE');
    const newStatus = allDelivered ? 'concluido' : schedule?.status || 'recebido_curral';

    const { error } = await supabase
      .from('agendamentos_abate')
      .update({
        observacoes: obs,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliveryId);

    if (error) throw error;

    // Registra na trilha de auditoria
    await supabase.from('audit_log').insert({
      user_id: adminId || null,
      acao: 'BAIXA_ENTREGA_MIUDOS',
      tabela: 'agendamentos_abate',
      registro_id: deliveryId,
      dados_novos: { itemType, delivered, status: newStatus },
    });
  },
};
