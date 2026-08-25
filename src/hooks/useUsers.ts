import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService, type CreateUserInput } from '../services/userService';
import type { User } from '../types';

export const USERS_QUERY_KEY = ['users'] as const;

export function useUsersQuery() {
  return useQuery<User[], Error>({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => userService.getUsers(),
    staleTime: 1000 * 60 * 2, // 2 minutos de cache fresco
    refetchOnWindowFocus: true,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => userService.createUser(input),
    onSuccess: (createdUser) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success(
        `Usuário ${createdUser.type === 'terceiro' ? 'Terceiro' : 'Cooperado'} "${createdUser.name}" cadastrado no banco de dados!`
      );
    },
    onError: (err: any) => {
      console.error('[useCreateUserMutation] Erro:', err);
      toast.error(err?.message || 'Não foi possível cadastrar o usuário.');
    },
  });
}

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, currentStatus }: { userId: string; currentStatus: 'active' | 'blocked'; userName: string }) =>
      userService.toggleUserStatus(userId, currentStatus),
    onSuccess: (nextStatus, variables) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      if (nextStatus === 'blocked') {
        toast.warning(`Acesso do usuário "${variables.userName}" foi BLOQUEADO.`);
      } else {
        toast.success(`Acesso do usuário "${variables.userName}" foi DESBLOQUEADO com sucesso!`);
      }
    },
    onError: (err: any) => {
      console.error('[useToggleUserStatusMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao alterar o status do usuário.');
    },
  });
}

export function useUpdateUserLimitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, newLimit }: { userId: string; newLimit: number }) =>
      userService.updateUserLimit(userId, newLimit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success('Limite semanal de abate atualizado no banco de dados!');
    },
    onError: (err: any) => {
      console.error('[useUpdateUserLimitMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao atualizar limite de abate.');
    },
  });
}

export function useUpdateUserDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      estabelecimentoId,
      data,
    }: {
      userId: string;
      estabelecimentoId?: string;
      data: { name: string; cpfCnpj: string; phone: string; email: string };
    }) => userService.updateUserDetails(userId, estabelecimentoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success('Dados da empresa atualizados no banco de dados!');
    },
    onError: (err: any) => {
      console.error('[useUpdateUserDetailsMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao atualizar dados da empresa.');
    },
  });
}

export function useUpdateBirthDateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, birthDate }: { userId: string; birthDate: string; userName: string }) =>
      userService.updateUserBirthDate(userId, birthDate),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success(`Data de aniversário de "${variables.userName}" atualizada!`);
    },
    onError: (err: any) => {
      console.error('[useUpdateBirthDateMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao atualizar data de aniversário.');
    },
  });
}

export function useSendBirthdayGreetingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ user, adminId }: { user: User; adminId?: string }) =>
      userService.sendBirthdayGreeting(user, adminId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['push_notifications'] });
      queryClient.invalidateQueries({ queryKey: ['news_items'] });
      toast.success(
        `🎉 Notificação de Feliz Aniversário enviada e sincronizada para ${variables.user.name}!`
      );
    },
    onError: (err: any) => {
      console.error('[useSendBirthdayGreetingMutation] Erro:', err);
      toast.error(err?.message || 'Falha ao enviar felicitações de aniversário.');
    },
  });
}

