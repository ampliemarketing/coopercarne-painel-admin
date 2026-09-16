-- ==============================================================================
-- Habilita Supabase Realtime para agendamentos_abate.
-- Sem isso, o painel administrativo só via um agendamento novo (criado pelo
-- app do cooperado/terceiro) depois de um refresh manual ou após o staleTime
-- do React Query expirar — não havia nenhuma notificação em tempo real.
-- ==============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos_abate;
