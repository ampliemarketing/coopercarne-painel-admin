import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deliveryService } from '../services/deliveryService';
import { SCHEDULES_QUERY_KEY } from './useSchedules';
import type { DeliverySchedule } from '../types';

export const DELIVERIES_QUERY_KEY = ['deliveries'] as const;

export function useDeliveriesQuery() {
  return useQuery<DeliverySchedule[], Error>({
    queryKey: DELIVERIES_QUERY_KEY,
    queryFn: () => deliveryService.getDeliveries(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateDeliveryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryId,
      itemType,
      delivered,
      adminId,
    }: {
      deliveryId: string;
      itemType: 'carcass' | 'heart' | 'liver';
      delivered: boolean;
      adminId?: string;
      userName?: string;
    }) => deliveryService.updateDeliveryItem(deliveryId, itemType, delivered, adminId),
    onSuccess: (_, variables) => {
      // Invalida tanto as entregas quanto os agendamentos e a câmara fria para sincronizar o espaço liberado
      queryClient.invalidateQueries({ queryKey: DELIVERIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY });

      const itemLabels = {
        carcass: 'Carcaça',
        heart: 'Coração',
        liver: 'Fígado',
      };

      toast.success(
        `Baixa registrada: ${itemLabels[variables.itemType]} ${
          variables.delivered ? 'liberada/entregue' : 'marcada como pendente'
        } (${variables.userName || variables.deliveryId}).`
      );
    },
    onError: (err: any) => {
      console.error('[useUpdateDeliveryMutation] Erro:', err);
      toast.error(err?.message || 'Erro ao atualizar entrega.');
    },
  });
}
