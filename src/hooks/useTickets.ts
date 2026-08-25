import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ticketService } from '../services/ticketService';
import type { Ticket } from '../types';

export const TICKETS_QUERY_KEY = ['tickets'] as const;

export function useTicketsQuery() {
  return useQuery<Ticket[], Error>({
    queryKey: TICKETS_QUERY_KEY,
    queryFn: () => ticketService.getTickets(),
    staleTime: 1000 * 30, // 30 segundos para chat
    refetchInterval: 10000, // Polling a cada 10s para novas mensagens
    refetchOnWindowFocus: true,
  });
}

export function useSendTicketMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chamadoId,
      text,
      senderId,
      senderTipo,
    }: {
      chamadoId: string;
      text: string;
      senderId: string;
      senderTipo?: string;
    }) => ticketService.sendMessage(chamadoId, text, senderId, senderTipo),
    onSuccess: (newMsg, variables) => {
      // Atualização otimista do cache do React Query
      queryClient.setQueryData<Ticket[]>(TICKETS_QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map((t) => {
          if (t.id === variables.chamadoId) {
            return {
              ...t,
              status: t.status === 'aberto' ? 'em_atendimento' : t.status,
              messages: [...t.messages, newMsg],
              updatedAt: 'Agora',
            };
          }
          return t;
        });
      });
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
      toast.success('Resposta enviada ao aplicativo do cooperado!');
    },
    onError: (err: any) => {
      console.error('[useSendTicketMessageMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao enviar mensagem.');
    },
  });
}

export function useUpdateTicketStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chamadoId,
      newStatus,
      adminId,
    }: {
      chamadoId: string;
      newStatus: 'aberto' | 'em_atendimento' | 'resolvido';
      adminId?: string;
      ticketCode?: string;
    }) => ticketService.updateStatus(chamadoId, newStatus, adminId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<Ticket[]>(TICKETS_QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map((t) => {
          if (t.id === variables.chamadoId) {
            return {
              ...t,
              status: variables.newStatus,
              updatedAt: 'Agora',
            };
          }
          return t;
        });
      });
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
      const statusLabels = {
        aberto: 'Aberto',
        em_atendimento: 'Em Atendimento',
        resolvido: 'Resolvido',
      };
      toast.success(
        `Status do chamado ${variables.ticketCode || variables.chamadoId} alterado para: ${
          statusLabels[variables.newStatus]
        }`
      );
    },
    onError: (err: any) => {
      console.error('[useUpdateTicketStatusMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao atualizar status do chamado.');
    },
  });
}

export function useUploadAttachmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chamadoId,
      file,
      uploaderId,
    }: {
      chamadoId: string;
      file: File;
      uploaderId: string;
    }) => ticketService.uploadAttachment(chamadoId, file, uploaderId),
    onSuccess: (newAttachment, variables) => {
      queryClient.setQueryData<Ticket[]>(TICKETS_QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map((t) => {
          if (t.id === variables.chamadoId) {
            return {
              ...t,
              attachments: [...(t.attachments || []), newAttachment],
            };
          }
          return t;
        });
      });
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
      toast.success(`Arquivo "${variables.file.name}" anexado com sucesso!`);
    },
    onError: (err: any) => {
      console.error('[useUploadAttachmentMutation] Erro:', err);
      toast.error(err?.message || 'Erro ao enviar anexo.');
    },
  });
}
