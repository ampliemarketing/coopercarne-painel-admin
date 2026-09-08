-- ==============================================================================
-- COOPERCARNE - POLÍTICAS DE ROW LEVEL SECURITY (RLS) & BLINDAGEM DE BANCO
-- Execute este script no SQL Editor do painel do Supabase (supabase.com)
-- ==============================================================================

-- 1. FUNÇÃO HELPER: VERIFICA SE O USUÁRIO ATUAL É ADMINISTRADOR OU OPERADOR
CREATE OR REPLACE FUNCTION public.is_admin_or_operator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND perfil IN ('admin', 'operador_camara')
      AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNÇÃO HELPER: VERIFICA SE O USUÁRIO É ADMINISTRADOR MASTER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND perfil = 'admin'
      AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- TABELA: PROFILES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admins e operadores podem ler todos os perfis
CREATE POLICY "Admins e Operadores podem ver todos os perfis"
ON public.profiles FOR SELECT
USING (public.is_admin_or_operator() OR auth.uid() = id);

-- Admins podem inserir e atualizar perfis
CREATE POLICY "Admins podem gerenciar perfis"
ON public.profiles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Usuário autenticado pode atualizar apenas o seu próprio perfil básico
CREATE POLICY "Usuarios podem atualizar o proprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- TABELA: AGENDAMENTOS_ABATE
-- ==============================================================================
ALTER TABLE public.agendamentos_abate ENABLE ROW LEVEL SECURITY;

-- Admins/Operadores veem toda a escala; Produtores veem apenas os seus agendamentos
CREATE POLICY "Visualizacao de agendamentos de abate"
ON public.agendamentos_abate FOR SELECT
USING (public.is_admin_or_operator() OR auth.uid() = user_id);

-- Usuários podem criar seus próprios agendamentos; Admins podem criar para qualquer um
CREATE POLICY "Criacao de agendamentos de abate"
ON public.agendamentos_abate FOR INSERT
WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);

-- Apenas Admins/Operadores podem aprovar, mudar status e dar baixa no curral
CREATE POLICY "Admins e Operadores podem atualizar agendamentos"
ON public.agendamentos_abate FOR UPDATE
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

-- Apenas Admins Master podem deletar agendamentos
CREATE POLICY "Apenas Admins podem deletar agendamentos"
ON public.agendamentos_abate FOR DELETE
USING (public.is_admin());

-- ==============================================================================
-- TABELA: CHAMADOS, MENSAGENS E ANEXOS
-- ==============================================================================
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamado_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamado_anexos ENABLE ROW LEVEL SECURITY;

-- Chamados
CREATE POLICY "Visualizacao de chamados"
ON public.chamados FOR SELECT
USING (public.is_admin_or_operator() OR auth.uid() = user_id);

CREATE POLICY "Criacao de chamados"
ON public.chamados FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_operator());

CREATE POLICY "Atualizacao de status do chamado"
ON public.chamados FOR UPDATE
USING (public.is_admin_or_operator() OR auth.uid() = user_id)
WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);

-- Mensagens
CREATE POLICY "Visualizacao de mensagens do chamado"
ON public.chamado_mensagens FOR SELECT
USING (
  public.is_admin_or_operator() OR
  EXISTS (SELECT 1 FROM public.chamados WHERE id = chamado_mensagens.chamado_id AND user_id = auth.uid())
);

CREATE POLICY "Envio de mensagens no chamado"
ON public.chamado_mensagens FOR INSERT
WITH CHECK (
  public.is_admin_or_operator() OR
  EXISTS (SELECT 1 FROM public.chamados WHERE id = chamado_mensagens.chamado_id AND user_id = auth.uid())
);

-- Anexos
CREATE POLICY "Visualizacao de anexos"
ON public.chamado_anexos FOR SELECT
USING (
  public.is_admin_or_operator() OR
  EXISTS (SELECT 1 FROM public.chamados WHERE id = chamado_anexos.chamado_id AND user_id = auth.uid())
);

CREATE POLICY "Insercao de anexos"
ON public.chamado_anexos FOR INSERT
WITH CHECK (
  public.is_admin_or_operator() OR
  EXISTS (SELECT 1 FROM public.chamados WHERE id = chamado_anexos.chamado_id AND user_id = auth.uid())
);

-- ==============================================================================
-- TABELA: PRECOS_REFERENCIA & PRECOS_HISTORICO
-- ==============================================================================
ALTER TABLE public.precos_referencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precos_historico ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados podem consultar cotações ativas
CREATE POLICY "Todos podem consultar precos de referencia"
ON public.precos_referencia FOR SELECT
USING (true);

-- Apenas Admins podem alterar cotações
CREATE POLICY "Admins podem gerenciar precos de referencia"
ON public.precos_referencia FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Todos podem ler historico de precos"
ON public.precos_historico FOR SELECT
USING (true);

CREATE POLICY "Admins podem inserir historico de precos"
ON public.precos_historico FOR INSERT
WITH CHECK (public.is_admin_or_operator());

-- ==============================================================================
-- TABELA: COMUNICADOS (NOTÍCIAS)
-- ==============================================================================
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

-- Usuários veem comunicados publicados; Admins veem tudo (incluindo rascunhos)
CREATE POLICY "Visualizacao de comunicados"
ON public.comunicados FOR SELECT
USING (publicado = true OR public.is_admin_or_operator());

-- Apenas Admins podem criar, editar e excluir comunicados
CREATE POLICY "Admins gerenciam comunicados"
ON public.comunicados FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- TABELA: AUDIT_LOG (TRILHA DE AUDITORIA)
-- ==============================================================================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas Administradores podem visualizar os logs de auditoria
CREATE POLICY "Apenas Admins podem ler logs de auditoria"
ON public.audit_log FOR SELECT
USING (public.is_admin());

-- Qualquer operação do sistema pode inserir logs de auditoria
CREATE POLICY "Permitir insercao de logs por usuarios autenticados"
ON public.audit_log FOR INSERT
WITH CHECK (true);

-- Ninguém pode deletar ou modificar logs de auditoria (Garantia de Imutabilidade)
-- (Não criamos política de UPDATE ou DELETE para a tabela audit_log)

-- ==============================================================================
-- TABELA: CAPACIDADE_DIARIA_ABATE & TAXAS_ABATE
-- ==============================================================================
ALTER TABLE public.capacidade_diaria_abate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxas_abate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura de capacidade diaria de abate"
ON public.capacidade_diaria_abate FOR SELECT
USING (true);

CREATE POLICY "Admins gerenciam capacidade diaria de abate"
ON public.capacidade_diaria_abate FOR ALL
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

CREATE POLICY "Leitura de taxas de abate"
ON public.taxas_abate FOR SELECT
USING (true);

CREATE POLICY "Admins gerenciam taxas de abate"
ON public.taxas_abate FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- TABELAS: PEDIDOS, PEDIDO_ITENS & PEDIDO_STATUS_LOG
-- ==============================================================================
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_status_log ENABLE ROW LEVEL SECURITY;

-- Admins e Operadores veem todos os pedidos; Cooperados veem apenas os seus
CREATE POLICY "Visualizacao de pedidos"
ON public.pedidos FOR SELECT
USING (public.is_admin_or_operator() OR auth.uid() = user_id);

CREATE POLICY "Criacao de pedidos pelo cooperado ou admin"
ON public.pedidos FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_operator());

CREATE POLICY "Atualizacao de pedidos por admins ou dono"
ON public.pedidos FOR UPDATE
USING (public.is_admin_or_operator() OR auth.uid() = user_id)
WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);

CREATE POLICY "Apenas admins podem deletar pedidos"
ON public.pedidos FOR DELETE
USING (public.is_admin());

-- Itens de Pedido
CREATE POLICY "Visualizacao de itens do pedido"
ON public.pedido_itens FOR SELECT
USING (
  public.is_admin_or_operator() OR
  EXISTS (SELECT 1 FROM public.pedidos WHERE id = pedido_itens.pedido_id AND user_id = auth.uid())
);

CREATE POLICY "Criacao e alteracao de itens do pedido"
ON public.pedido_itens FOR ALL
USING (
  public.is_admin_or_operator() OR
  EXISTS (SELECT 1 FROM public.pedidos WHERE id = pedido_itens.pedido_id AND user_id = auth.uid())
);

-- Log de Status de Pedido
CREATE POLICY "Visualizacao de status log"
ON public.pedido_status_log FOR SELECT
USING (
  public.is_admin_or_operator() OR
  EXISTS (SELECT 1 FROM public.pedidos WHERE id = pedido_status_log.pedido_id AND user_id = auth.uid())
);

CREATE POLICY "Insercao de status log"
ON public.pedido_status_log FOR INSERT
WITH CHECK (true);

-- ==============================================================================
-- TABELA: NOTIFICACOES (Alertas e Felicitações direcionadas)
-- ==============================================================================
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver suas proprias notificacoes"
ON public.notificacoes FOR SELECT
USING (auth.uid() = user_id OR public.is_admin_or_operator());

CREATE POLICY "Admins e Operadores podem criar notificacoes"
ON public.notificacoes FOR INSERT
WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);

CREATE POLICY "Usuarios podem marcar suas notificacoes como lidas"
ON public.notificacoes FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin_or_operator())
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_operator());

CREATE POLICY "Admins e usuarios podem deletar suas notificacoes"
ON public.notificacoes FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());



-- ==============================================================================
-- STORAGE BUCKETS POLICIES (Supabase Storage)
-- ==============================================================================
-- Bucket: chamados
INSERT INTO storage.buckets (id, name, public)
VALUES ('chamados', 'chamados', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Permitir upload em chamados por usuarios autenticados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chamados' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir download publico de arquivos de chamados"
ON storage.objects FOR SELECT
USING (bucket_id = 'chamados');

-- Bucket: documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Permitir upload de documentos por autenticados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir leitura de documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos');
