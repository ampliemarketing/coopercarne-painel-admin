import { supabase, isSupabaseReady } from '../lib/supabase';
import { INITIAL_ORDERS } from '../mockData';
import type { ColdRoomAnimalType, ColdRoomPartType, Order, OrderItem, OrderStatus } from '../types';
import { coldRoomService } from './coldRoomService';

// Cache em memória para modificações de status em modo mock/fallback
let mockOrdersCache: Order[] = [...INITIAL_ORDERS];

export const orderService = {
  /**
   * Busca a lista de pedidos de carnes/cortes
   */
  async getOrders(): Promise<Order[]> {
    if (!isSupabaseReady()) {
      return [...mockOrdersCache];
    }

    try {
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
          comprovante_url,
          created_at,
          updated_at,
          profiles!pedidos_user_id_fkey (
            id,
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
            tipo_animal,
            tipo_peca,
            quantidade_pecas
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[orderService] Aviso ao buscar pedidos no Supabase:', error.message);
        // Fallback gracioso para dados locais
        return [...mockOrdersCache];
      }

      if (!data || data.length === 0) {
        // Se ainda não houver pedidos no banco, exibe os mock com segurança
        return [...mockOrdersCache];
      }

      return data.map((row: any) => {
        const prof = row.profiles;
        const estab = prof?.estabelecimentos;
        const producerName = prof?.nome || estab?.razao_social || 'Produtor COOPERCARNE';
        const estabName = estab?.razao_social || '';
        const rawItems = (row.pedido_itens || []) as any[];

        const items: OrderItem[] = rawItems.map((item) => {
          const cutName = item.corte || 'Quarto';
          const lower = cutName.toLowerCase();
          let category: 'carcaca' | 'quarto' | 'miudos' = 'quarto';
          if (lower.includes('carcaça') || lower.includes('banda')) {
            category = 'carcaca';
          } else if (lower.includes('quarto') || lower.includes('agulha') || lower.includes('costelar')) {
            category = 'quarto';
          } else {
            category = 'miudos';
          }

          return {
            id: item.id,
            category,
            cutName,
            piecesCount: Number(item.quantidade_pecas) || 1,
            quantityKg: Number(item.quantidade_kg) || 0,
            notes: item.observacoes || undefined,
            coldRoomAnimalType: (item.tipo_animal as ColdRoomAnimalType) || undefined,
            coldRoomPartType: (item.tipo_peca as ColdRoomPartType) || undefined,
          };
        });

        const totalWeightKg = items.reduce((acc, it) => acc + (it.quantityKg || 0), 0);
        const totalPieces = items.reduce((acc, it) => acc + (it.piecesCount || 1), 0);

        return {
          id: row.id,
          code: row.codigo || `PED-${row.id.substring(0, 6).toUpperCase()}`,
          userId: row.user_id,
          userName: producerName,
          establishmentName: estabName,
          userType: (prof?.perfil as 'cooperado' | 'terceiro') || 'cooperado',
          status: (row.status as OrderStatus) || 'enviado',
          meatType: row.tipo_carne || 'bovina',
          itemsCount: items.length,
          items,
          totalWeightKg,
          totalPieces,
          deliveryLocation: row.local_entrega || 'Matriz COOPERCARNE (Retirada no Local)',
          desiredDeliveryDate: row.data_entrega_desejada || undefined,
          notes: row.observacoes || '',
          receiptUrl: row.comprovante_url || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at || row.created_at,
        };
      });
    } catch (err) {
      console.error('[orderService] Erro getOrders:', err);
      return [...mockOrdersCache];
    }
  },

  /**
   * Atualiza o status de um pedido (ex: enviado -> em_producao -> pronto_retirada -> entregue).
   *
   * Quando o pedido é marcado como "entregue", dá baixa FEFO no estoque da câmara fria
   * para cada item classificado (coldRoomAnimalType/coldRoomPartType), descontando sempre
   * do lote de abate mais próximo do vencimento primeiro. Por isso é necessário passar o
   * pedido completo (com userId e items) nessa chamada.
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    adminId?: string,
    userName?: string,
    order?: Order
  ): Promise<void> {
    // Atualiza cache em memória
    mockOrdersCache = mockOrdersCache.map((ord) =>
      ord.id === orderId || ord.code === orderId
        ? { ...ord, status: newStatus, updatedAt: new Date().toISOString() }
        : ord
    );

    if (!isSupabaseReady()) return;

    try {
      // 1. Atualiza na tabela 'pedidos'
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.warn('[orderService] Não foi possível persistir no Supabase (pode ser mock):', error.message);
      }

      // 2. Insere log de status
      try {
        await supabase.from('pedido_status_log').insert({
          pedido_id: orderId,
          status_novo: newStatus,
          alterado_por: adminId || null,
          motivo: `Status atualizado para ${newStatus} pelo painel administrativo`,
        });
      } catch {
        // ignora se tabela de log falhar
      }

      // 3. Trilha de auditoria administrativa
      try {
        await supabase.from('audit_log').insert({
          user_id: adminId || null,
          acao: 'ATUALIZAR_STATUS_PEDIDO',
          tabela: 'pedidos',
          registro_id: orderId,
          dados_novos: { status: newStatus, responsavel: userName || 'Admin' },
        });
      } catch {
        // ignora se audit_log não estiver configurado
      }

      // 4. Baixa FEFO na câmara fria (somente na transição para "entregue")
      if (newStatus === 'entregue' && order) {
        for (const item of order.items) {
          if (!item.coldRoomAnimalType || !item.coldRoomPartType || !item.piecesCount) continue;
          try {
            await coldRoomService.consumirEstoqueFEFO({
              userId: order.userId,
              animalType: item.coldRoomAnimalType,
              partType: item.coldRoomPartType,
              quantidade: item.piecesCount,
              pedidoId: orderId,
              pedidoItemId: item.id,
              criadoPor: adminId,
            });
          } catch (fefoErr) {
            console.error('[orderService] Erro ao dar baixa FEFO na câmara fria:', fefoErr);
          }
        }
      }
    } catch (err) {
      console.error('[orderService] Erro ao atualizar status:', err);
    }
  },

  /**
   * Atualiza a classificação de um item do pedido (espécie/parte/peças) usada para
   * a baixa FEFO no estoque da câmara fria. Chamado a partir da tela de detalhes do
   * pedido, enquanto o pedido ainda não foi entregue.
   */
  async updateOrderItem(
    itemId: string,
    data: { animalType?: ColdRoomAnimalType | null; partType?: ColdRoomPartType | null; piecesCount?: number }
  ): Promise<void> {
    if (!isSupabaseReady()) return;

    const { error } = await supabase
      .from('pedido_itens')
      .update({
        ...(data.animalType !== undefined ? { tipo_animal: data.animalType } : {}),
        ...(data.partType !== undefined ? { tipo_peca: data.partType } : {}),
        ...(data.piecesCount !== undefined ? { quantidade_pecas: data.piecesCount } : {}),
      })
      .eq('id', itemId);

    if (error) {
      console.error('[orderService] Erro ao classificar item do pedido:', error.message);
      throw error;
    }
  },
};
