import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  communicationService,
  type DailyQuoteItem,
  type CreateNewsInput,
} from '../services/communicationService';
import type { NewsItem, PushNotification } from '../types';

export const QUOTES_QUERY_KEY = ['daily_quotes'] as const;
export const NEWS_QUERY_KEY = ['news_items'] as const;

export function useQuotesQuery() {
  return useQuery<DailyQuoteItem[], Error>({
    queryKey: QUOTES_QUERY_KEY,
    queryFn: () => communicationService.getDailyQuotes(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useUpdateQuoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      quoteId,
      quoteName,
      newPrice,
      adminId,
    }: {
      quoteId: string;
      quoteName: string;
      newPrice: number;
      adminId?: string;
    }) => communicationService.updateQuotePrice(quoteId, quoteName, newPrice, adminId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      toast.success(
        `Cotação de "${variables.quoteName}" atualizada para R$ ${variables.newPrice.toFixed(2)}!`
      );
    },
    onError: (err: any) => {
      console.error('[useUpdateQuoteMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao atualizar cotação.');
    },
  });
}

export function useNewsQuery() {
  return useQuery<NewsItem[], Error>({
    queryKey: NEWS_QUERY_KEY,
    queryFn: () => communicationService.getNews(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateNewsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, adminId }: { input: CreateNewsInput; adminId?: string }) =>
      communicationService.createNews(input, adminId),
    onSuccess: (newNews) => {
      queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY });
      toast.success(`Comunicado "${newNews.title}" publicado com sucesso no aplicativo!`);
    },
    onError: (err: any) => {
      console.error('[useCreateNewsMutation] Erro:', err);
      toast.error(err?.message || 'Erro ao publicar notícia.');
    },
  });
}

export function useToggleNewsPublishedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      communicationService.toggleNewsPublished(id, published),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY });
      toast.info(
        variables.published
          ? 'Notícia publicada no aplicativo dos produtores.'
          : 'Notícia alterada para rascunho.'
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao alterar status da notícia.');
    },
  });
}

export function useDeleteNewsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => communicationService.deleteNews(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['push_notifications'] });
      toast.success('Notícia removida com sucesso.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao remover notícia.');
    },
  });
}

export const PUSH_QUERY_KEY = ['push_notifications'] as const;

export function usePushNotificationsQuery() {
  return useQuery<PushNotification[], Error>({
    queryKey: PUSH_QUERY_KEY,
    queryFn: () => communicationService.getPushNotifications(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSendPushMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      adminId,
    }: {
      input: { title: string; message: string; targetAudience: 'todos' | 'cooperados' | 'terceiros' };
      adminId?: string;
    }) => communicationService.sendPushNotification(input, adminId),
    onSuccess: (newPush) => {
      queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY });
      toast.success(`Notificação Push "${newPush.title}" disparada aos aplicativos!`);
    },
    onError: (err: any) => {
      console.error('[useSendPushMutation] Erro:', err);
      toast.error(err?.message || 'Erro ao disparar notificação push.');
    },
  });
}
