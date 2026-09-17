import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { orderService } from '../services/orderService';
import { MOVIMENTOS_QUERY_KEY } from './useCamaraFriaMovimentos';
import type { ColdRoomAnimalType, ColdRoomPartType, Order, OrderStatus } from '../types';

export const ORDERS_QUERY_KEY = ['orders'] as const;

export function useOrdersQuery() {
  return useQuery<Order[], Error>({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: () => orderService.getOrders(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      newStatus,
      adminId,
      userName,
      order,
    }: {
      orderId: string;
      newStatus: OrderStatus;
      adminId?: string;
      userName?: string;
      // Pedido completo (userId + items classificados), necessário para dar baixa
      // FEFO no estoque da câmara fria quando o novo status é "entregue".
      order?: Order;
    }) => orderService.updateOrderStatus(orderId, newStatus, adminId, userName, order),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      if (variables.newStatus === 'entregue') {
        queryClient.invalidateQueries({ queryKey: MOVIMENTOS_QUERY_KEY });
      }

      const statusLabels: Record<OrderStatus, string> = {
        rascunho: 'Rascunho',
        enviado: 'Enviado',
        em_analise: 'Em Análise',
        em_producao: 'Em Produção / Preparo',
        pronto_retirada: 'Pronto para Retirada',
        em_transito: 'Em Trânsito / Rota',
        entregue: 'Entregue / Concluído',
        cancelado: 'Cancelado',
      };

      toast.success(
        `Status do pedido ${variables.orderId} atualizado para "${statusLabels[variables.newStatus]}".`
      );
    },
    onError: (err: any) => {
      console.error('[useUpdateOrderStatusMutation] Erro:', err);
      toast.error(err?.message || 'Erro ao atualizar status do pedido.');
    },
  });
}

export function useUpdateOrderItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      animalType,
      partType,
      piecesCount,
    }: {
      itemId: string;
      animalType?: ColdRoomAnimalType | null;
      partType?: ColdRoomPartType | null;
      piecesCount?: number;
    }) => orderService.updateOrderItem(itemId, { animalType, partType, piecesCount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
    onError: (err: any) => {
      console.error('[useUpdateOrderItemMutation] Erro:', err);
      toast.error(err?.message || 'Erro ao classificar item do pedido.');
    },
  });
}
