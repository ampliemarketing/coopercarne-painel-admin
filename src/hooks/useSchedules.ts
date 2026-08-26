import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { scheduleService, type CreateScheduleInput } from '../services/scheduleService';
import type { SlaughterSchedule } from '../types';

export const SCHEDULES_QUERY_KEY = ['schedules'] as const;
export const TAXAS_QUERY_KEY = ['taxas_abate'] as const;

export function useSchedulesQuery() {
  return useQuery<SlaughterSchedule[], Error>({
    queryKey: SCHEDULES_QUERY_KEY,
    queryFn: () => scheduleService.getSchedules(),
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchOnWindowFocus: true,
  });
}

export function useTaxasAbateQuery() {
  return useQuery({
    queryKey: TAXAS_QUERY_KEY,
    queryFn: () => scheduleService.getTaxasAbate(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateScheduleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateScheduleInput) => scheduleService.createSchedule(input),
    onSuccess: (newSchedule) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY });
      if (newSchedule.userType === 'terceiro') {
        toast.info(
          `Agendamento de Terceiro criado para "${newSchedule.userName}" (${newSchedule.quantity} ${newSchedule.animalType}s)! Pendente de Aprovação.`
        );
      } else {
        toast.success(
          `Agendamento criado com sucesso para "${newSchedule.userName}" (${newSchedule.quantity} ${newSchedule.animalType}s)!`
        );
      }
    },
    onError: (err: any) => {
      console.error('[useCreateScheduleMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao salvar agendamento de abate.');
    },
  });
}

export function useUpdateScheduleStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      newStatus,
      adminId,
    }: {
      scheduleId: string;
      newStatus: 'aprovado' | 'rejeitado' | 'cancelado';
      userName?: string;
      adminId?: string;
    }) => scheduleService.updateStatus(scheduleId, newStatus, adminId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY });
      if (variables.newStatus === 'aprovado') {
        toast.success(`Agendamento de "${variables.userName || variables.scheduleId}" foi APROVADO!`);
      } else if (variables.newStatus === 'rejeitado') {
        toast.warning(`Agendamento de "${variables.userName || variables.scheduleId}" foi REJEITADO.`);
      } else {
        toast.info(`Alerta/Cancelamento registrado para "${variables.userName || variables.scheduleId}".`);
      }
    },
    onError: (err: any) => {
      console.error('[useUpdateScheduleStatusMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao atualizar status do agendamento.');
    },
  });
}

export function useConfirmArrivalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      confirmedQty,
      notes,
    }: {
      scheduleId: string;
      confirmedQty: number;
      notes?: string;
      userName?: string;
      animalType?: string;
    }) => scheduleService.confirmArrival(scheduleId, confirmedQty, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY });
      toast.success(
        `Chegada confirmada no curral: ${variables.confirmedQty} cabeças de ${variables.animalType || 'animais'} (${variables.userName}).`
      );
    },
    onError: (err: any) => {
      console.error('[useConfirmArrivalMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao confirmar chegada no curral.');
    },
  });
}

export function useConfirmarPresencaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      confirmado,
      quantidadeConfirmada,
    }: {
      scheduleId: string;
      confirmado: boolean;
      quantidadeConfirmada?: number;
      userName?: string;
    }) => scheduleService.confirmarPresenca(scheduleId, confirmado, quantidadeConfirmada),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY });
      if (variables.confirmado) {
        toast.success(`Presença confirmada para "${variables.userName || variables.scheduleId}".`);
      } else {
        toast.warning(`Agendamento de "${variables.userName || variables.scheduleId}" marcado como NÃO CONFIRMADO. Vaga liberada na agenda.`);
      }
    },
    onError: (err: any) => {
      console.error('[useConfirmarPresencaMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao confirmar presença.');
    },
  });
}

export function useMarcarRecebidoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      quantidadeRecebida,
      recebidoPor,
    }: {
      scheduleId: string;
      quantidadeRecebida: number;
      recebidoPor?: string;
      userName?: string;
    }) => scheduleService.marcarRecebido(scheduleId, quantidadeRecebida, recebidoPor),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY });
      toast.success(`Recebimento registrado: ${variables.quantidadeRecebida} cabeças de "${variables.userName || variables.scheduleId}". Em processo.`);
    },
    onError: (err: any) => {
      console.error('[useMarcarRecebidoMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao marcar recebimento.');
    },
  });
}

export function useFinalizarAbateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      quantidadePerda,
      finalizadoPor,
    }: {
      scheduleId: string;
      quantidadePerda: number;
      finalizadoPor?: string;
      userName?: string;
    }) => scheduleService.finalizarAbate(scheduleId, quantidadePerda, finalizadoPor),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY });
      toast.success(`Abate de "${variables.userName || variables.scheduleId}" finalizado.`);
    },
    onError: (err: any) => {
      console.error('[useFinalizarAbateMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao finalizar abate.');
    },
  });
}
