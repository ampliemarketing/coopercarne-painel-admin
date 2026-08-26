-- ==============================================================================
-- Fluxo operacional de status dos agendamentos de abate (tela "Abates")
--
--   reservado -> confirmado / nao_confirmado   (cooperado confirma na véspera pelo app)
--   confirmado -> em_processo                  (admin marca "Recebido" com a qtd que chegou)
--   em_processo -> finalizado                  (admin finaliza, com perda opcional)
--
-- "nao_confirmado" libera a vaga ocupada em capacidade_diaria_abate.
-- ==============================================================================

ALTER TABLE public.agendamentos_abate
  ADD COLUMN status_operacional text NOT NULL DEFAULT 'reservado',
  ADD COLUMN quantidade_confirmada integer,
  ADD COLUMN confirmado_em timestamptz,
  ADD COLUMN quantidade_recebida integer,
  ADD COLUMN recebido_em timestamptz,
  ADD COLUMN recebido_por uuid REFERENCES public.profiles(id),
  ADD COLUMN quantidade_perda integer NOT NULL DEFAULT 0,
  ADD COLUMN quantidade_processada integer,
  ADD COLUMN finalizado_em timestamptz,
  ADD COLUMN finalizado_por uuid REFERENCES public.profiles(id);

ALTER TABLE public.agendamentos_abate
  ADD CONSTRAINT chk_status_operacional CHECK (
    status_operacional IN ('reservado', 'confirmado', 'nao_confirmado', 'em_processo', 'finalizado')
  );

CREATE INDEX idx_agendamentos_abate_status_operacional ON public.agendamentos_abate(status_operacional);

-- Permite que o próprio dono do agendamento (cooperado/terceiro) confirme presença dele mesmo,
-- no mesmo nível de confiança já usado nas policies de SELECT/INSERT desta tabela.
DROP POLICY IF EXISTS "Admins e Operadores podem atualizar agendamentos" ON public.agendamentos_abate;
CREATE POLICY "Admins, operadores e o dono podem atualizar agendamentos" ON public.agendamentos_abate FOR UPDATE
  USING (public.is_admin_or_operator() OR auth.uid() = user_id)
  WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);
