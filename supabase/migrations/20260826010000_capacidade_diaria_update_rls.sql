-- ==============================================================================
-- Permite que qualquer usuário autenticado incremente/decremente o contador
-- "ocupado" de capacidade_diaria_abate ao criar ou (não) confirmar um agendamento
-- pelo app do cooperado/terceiro. INSERT/DELETE continuam só para admins/operadores
-- (via a policy "Admins gerenciam capacidade diaria de abate" já existente).
-- ==============================================================================

CREATE POLICY "Autenticados podem atualizar ocupacao da capacidade diaria" ON public.capacidade_diaria_abate FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
