-- ==============================================================================
-- COOPERCARNE - SCHEMA COMPLETO (RECONSTRUÍDO)
-- Reconstruído a partir de src/types/supabase.ts (tipos gerados do banco antigo),
-- supabase_rls_policies.sql, update_constraints.sql e grant_permissions.sql.
-- Execute este arquivo inteiro no SQL Editor do novo projeto Supabase
-- (ou via `supabase db push` se estiver usando o CLI linkado ao novo projeto).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELAS
-- ==============================================================================

CREATE TABLE public.estabelecimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  cnpj text NOT NULL UNIQUE,
  tipo_estabelecimento text NOT NULL,
  cidade text NOT NULL,
  estado text NOT NULL,
  endereco text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  telefone text,
  perfil text NOT NULL DEFAULT 'cooperado',
  estabelecimento_id uuid REFERENCES public.estabelecimentos(id),
  avatar_url text,
  data_nascimento date,
  ativo boolean NOT NULL DEFAULT true,
  verificado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.termos_de_uso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  conteudo text NOT NULL,
  versao text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  vigente_desde timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (titulo, versao)
);

CREATE TABLE public.aceites_termos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  termo_id uuid NOT NULL REFERENCES public.termos_de_uso(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  ip_address inet NOT NULL DEFAULT '0.0.0.0',
  aceito_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (termo_id, user_id)
);

CREATE TABLE public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  valor jsonb NOT NULL,
  descricao text,
  editavel boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cortes_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo_carne text NOT NULL,
  unidade text NOT NULL DEFAULT 'kg',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.precos_referencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto text NOT NULL,
  categoria text NOT NULL,
  valor numeric(12,2) NOT NULL,
  unidade text NOT NULL,
  variacao_percentual numeric(6,2),
  ativo boolean NOT NULL DEFAULT true,
  data_referencia date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.precos_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto text NOT NULL,
  valor numeric(12,2) NOT NULL,
  data date NOT NULL,
  fonte text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.taxas_abate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  especie text NOT NULL,
  valor_cooperado numeric(12,2) NOT NULL,
  valor_terceiro numeric(12,2) NOT NULL,
  unidade text NOT NULL DEFAULT 'cabeça',
  vigencia_inicio date NOT NULL,
  vigencia_fim date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.capacidade_diaria_abate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  tipo_animal text NOT NULL,
  capacidade_total integer NOT NULL,
  ocupado integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (data, tipo_animal)
);

CREATE TABLE public.status_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade text NOT NULL,
  status_de text NOT NULL,
  status_para text NOT NULL,
  requer_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agendamentos_abate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  tipo_animal text NOT NULL,
  quantidade integer NOT NULL,
  data_abate date NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  requer_aprovacao boolean NOT NULL DEFAULT false,
  aprovado_por uuid REFERENCES public.profiles(id),
  aprovado_at timestamptz,
  rendimento_medio numeric(5,2),
  romaneio_url text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.agendamento_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id uuid NOT NULL REFERENCES public.agendamentos_abate(id),
  status_anterior text,
  status_novo text NOT NULL,
  motivo text,
  alterado_por uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.limites_abate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  tipo_animal text NOT NULL,
  mes_referencia date NOT NULL,
  limite_mensal integer NOT NULL,
  abates_realizados integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo_animal, mes_referencia)
);

CREATE TABLE public.alertas_preco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  tipo_animal text NOT NULL,
  condicao text NOT NULL,
  valor numeric(12,2) NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  disparado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.chamados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  assunto text NOT NULL,
  descricao text NOT NULL,
  categoria text NOT NULL,
  prioridade text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'aberto',
  atribuido_a uuid REFERENCES public.profiles(id),
  resolvido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.chamado_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id uuid NOT NULL REFERENCES public.chamados(id),
  remetente_id uuid NOT NULL REFERENCES public.profiles(id),
  remetente_tipo text NOT NULL,
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chamado_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id uuid NOT NULL REFERENCES public.chamados(id),
  mensagem_id uuid REFERENCES public.chamado_mensagens(id),
  uploaded_por uuid NOT NULL REFERENCES public.profiles(id),
  nome_arquivo text NOT NULL,
  arquivo_url text NOT NULL,
  mime_type text,
  tamanho bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text NOT NULL DEFAULT 'aviso',
  destinatario_perfil text,
  publicado boolean NOT NULL DEFAULT false,
  publicado_por uuid REFERENCES public.profiles(id),
  data_publicacao timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.comunicado_leituras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id uuid NOT NULL REFERENCES public.comunicados(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  lido_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comunicado_id, user_id)
);

CREATE TABLE public.noticias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  resumo text NOT NULL,
  conteudo text NOT NULL,
  tipo text NOT NULL DEFAULT 'noticia',
  imagem_url text,
  destaque boolean NOT NULL DEFAULT false,
  publicado boolean NOT NULL DEFAULT false,
  publicado_por uuid REFERENCES public.profiles(id),
  data_publicacao timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text NOT NULL,
  categoria text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  lida_at timestamptz,
  action_url text,
  referencia_id uuid,
  referencia_tipo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cotacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  tipo_produto text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  observacoes text,
  prazo_resposta timestamptz,
  respondido_por uuid REFERENCES public.profiles(id),
  respondido_at timestamptz,
  observacao_resposta text,
  valor_negociado numeric(12,2),
  unidade_negociada text,
  validade timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.cotacao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id uuid NOT NULL REFERENCES public.cotacoes(id),
  descricao text NOT NULL,
  quantidade numeric(12,3) NOT NULL,
  unidade text NOT NULL DEFAULT 'kg',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  cotacao_id uuid REFERENCES public.cotacoes(id),
  duplicado_de uuid REFERENCES public.pedidos(id),
  tipo_carne text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  total numeric(12,2) NOT NULL DEFAULT 0,
  local_entrega text,
  data_entrega_desejada date,
  comprovante_url text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id),
  corte text NOT NULL,
  quantidade_kg numeric(12,3) NOT NULL,
  preco_unitario numeric(12,2) NOT NULL,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pedido_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id),
  status_anterior text,
  status_novo text NOT NULL,
  motivo text,
  alterado_por uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  agendamento_id uuid REFERENCES public.agendamentos_abate(id),
  pedido_id uuid REFERENCES public.pedidos(id),
  nome text NOT NULL,
  tipo text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  arquivo_url text,
  mime_type text,
  arquivo_tamanho bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.documento_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  documento_id uuid REFERENCES public.documentos(id),
  nome text NOT NULL,
  tipo_documento text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  atendido_por uuid REFERENCES public.profiles(id),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sugestoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  categoria text NOT NULL,
  texto text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  lida_at timestamptz,
  lida_por uuid REFERENCES public.profiles(id),
  resposta text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  push_token text NOT NULL,
  platform text NOT NULL,
  device_name text,
  ativo boolean NOT NULL DEFAULT true,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (push_token)
);

CREATE TABLE public.user_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  etapa_atual integer DEFAULT 0,
  concluido boolean NOT NULL DEFAULT false,
  concluido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  theme text NOT NULL DEFAULT 'system',
  notificacoes_email boolean NOT NULL DEFAULT true,
  notificacoes_push boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_private_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  cpf text NOT NULL,
  interesse_volume text,
  aceite_termos_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  acao text NOT NULL,
  tabela text NOT NULL,
  registro_id text,
  dados_anteriores jsonb,
  dados_novos jsonb,
  ip_address inet NOT NULL DEFAULT '0.0.0.0',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  event_type text NOT NULL,
  ip_address inet NOT NULL DEFAULT '0.0.0.0',
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 2. CONSTRAINTS DE VALOR (ENUMS via CHECK) — de update_constraints.sql
-- ==============================================================================

ALTER TABLE public.profiles ADD CONSTRAINT profiles_perfil_check
  CHECK (perfil = ANY (ARRAY['cooperado'::text, 'comprador'::text, 'gerente'::text, 'admin'::text, 'terceiro'::text, 'nao_cooperado'::text, 'operador_camara'::text]));

ALTER TABLE public.estabelecimentos ADD CONSTRAINT estabelecimentos_tipo_estabelecimento_check
  CHECK (tipo_estabelecimento = ANY (ARRAY['supermercado'::text, 'atacado'::text, 'acougue'::text, 'restaurante'::text, 'frigorifico'::text, 'produtor'::text, 'outro'::text]));

-- ==============================================================================
-- 3. VIEW: PROFILES_PUBLIC (projeção segura, sem email/telefone/CPF)
-- ==============================================================================

CREATE VIEW public.profiles_public AS
SELECT id, nome, avatar_url, perfil, verificado, estabelecimento_id
FROM public.profiles
WHERE deleted_at IS NULL;

-- ==============================================================================
-- 4. FUNÇÕES AUXILIARES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_operator()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND perfil IN ('admin', 'operador_camara')
      AND ativo = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND perfil = 'admin'
      AND ativo = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT perfil FROM public.profiles WHERE id = auth.uid();
$$;

-- Gera códigos sequenciais (ex: PED-000001) por tabela, usado pelos triggers abaixo.
CREATE OR REPLACE FUNCTION public.generate_sequential_code(prefix text, table_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_next  text;
BEGIN
  CASE table_name
    WHEN 'pedidos' THEN
      SELECT count(*) INTO v_count FROM public.pedidos WHERE codigo LIKE prefix || '-%';
    WHEN 'chamados' THEN
      SELECT count(*) INTO v_count FROM public.chamados WHERE codigo LIKE prefix || '-%';
    WHEN 'cotacoes' THEN
      SELECT count(*) INTO v_count FROM public.cotacoes WHERE codigo LIKE prefix || '-%';
    ELSE
      RAISE EXCEPTION 'generate_sequential_code: tabela % não suportada', table_name;
  END CASE;

  v_next := prefix || '-' || lpad((v_count + 1)::text, 6, '0');
  RETURN v_next;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_codigo_pedidos()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    NEW.codigo := public.generate_sequential_code('PED', 'pedidos');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_codigo_chamados()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    NEW.codigo := public.generate_sequential_code('TK', 'chamados');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_codigo_cotacoes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    NEW.codigo := public.generate_sequential_code('COT', 'cotacoes');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_codigo_pedidos BEFORE INSERT ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_codigo_pedidos();

CREATE TRIGGER trg_set_codigo_chamados BEFORE INSERT ON public.chamados
  FOR EACH ROW EXECUTE FUNCTION public.set_codigo_chamados();

CREATE TRIGGER trg_set_codigo_cotacoes BEFORE INSERT ON public.cotacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_codigo_cotacoes();

-- ==============================================================================
-- 5. ÍNDICES (foreign keys e soft-delete)
-- ==============================================================================

CREATE INDEX idx_profiles_estabelecimento_id ON public.profiles(estabelecimento_id);
CREATE INDEX idx_agendamentos_abate_user_id ON public.agendamentos_abate(user_id);
CREATE INDEX idx_agendamento_status_log_agendamento_id ON public.agendamento_status_log(agendamento_id);
CREATE INDEX idx_limites_abate_user_id ON public.limites_abate(user_id);
CREATE INDEX idx_alertas_preco_user_id ON public.alertas_preco(user_id);
CREATE INDEX idx_chamados_user_id ON public.chamados(user_id);
CREATE INDEX idx_chamado_mensagens_chamado_id ON public.chamado_mensagens(chamado_id);
CREATE INDEX idx_chamado_anexos_chamado_id ON public.chamado_anexos(chamado_id);
CREATE INDEX idx_comunicado_leituras_comunicado_id ON public.comunicado_leituras(comunicado_id);
CREATE INDEX idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX idx_cotacoes_user_id ON public.cotacoes(user_id);
CREATE INDEX idx_cotacao_itens_cotacao_id ON public.cotacao_itens(cotacao_id);
CREATE INDEX idx_pedidos_user_id ON public.pedidos(user_id);
CREATE INDEX idx_pedido_itens_pedido_id ON public.pedido_itens(pedido_id);
CREATE INDEX idx_pedido_status_log_pedido_id ON public.pedido_status_log(pedido_id);
CREATE INDEX idx_documentos_user_id ON public.documentos(user_id);
CREATE INDEX idx_documento_solicitacoes_user_id ON public.documento_solicitacoes(user_id);
CREATE INDEX idx_sugestoes_user_id ON public.sugestoes(user_id);
CREATE INDEX idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_auth_events_user_id ON public.auth_events(user_id);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins e Operadores podem ver todos os perfis" ON public.profiles FOR SELECT
  USING (public.is_admin_or_operator() OR auth.uid() = id);
CREATE POLICY "Admins podem gerenciar perfis" ON public.profiles FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Usuarios podem atualizar o proprio perfil" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE public.estabelecimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem ler estabelecimentos" ON public.estabelecimentos FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Admins gerenciam estabelecimentos" ON public.estabelecimentos FOR ALL
  USING (public.is_admin_or_operator()) WITH CHECK (public.is_admin_or_operator());

ALTER TABLE public.agendamentos_abate ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizacao de agendamentos de abate" ON public.agendamentos_abate FOR SELECT
  USING (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Criacao de agendamentos de abate" ON public.agendamentos_abate FOR INSERT
  WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Admins e Operadores podem atualizar agendamentos" ON public.agendamentos_abate FOR UPDATE
  USING (public.is_admin_or_operator()) WITH CHECK (public.is_admin_or_operator());
CREATE POLICY "Apenas Admins podem deletar agendamentos" ON public.agendamentos_abate FOR DELETE
  USING (public.is_admin());

ALTER TABLE public.agendamento_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizacao de status log de agendamento" ON public.agendamento_status_log FOR SELECT
  USING (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.agendamentos_abate WHERE id = agendamento_status_log.agendamento_id AND user_id = auth.uid()));
CREATE POLICY "Insercao de status log de agendamento" ON public.agendamento_status_log FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.limites_abate ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizacao de limites de abate" ON public.limites_abate FOR SELECT
  USING (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Admins gerenciam limites de abate" ON public.limites_abate FOR ALL
  USING (public.is_admin_or_operator()) WITH CHECK (public.is_admin_or_operator());

ALTER TABLE public.alertas_preco ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam seus alertas de preco" ON public.alertas_preco FOR ALL
  USING (auth.uid() = user_id OR public.is_admin_or_operator())
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_operator());

ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamado_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamado_anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizacao de chamados" ON public.chamados FOR SELECT
  USING (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Criacao de chamados" ON public.chamados FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_operator());
CREATE POLICY "Atualizacao de status do chamado" ON public.chamados FOR UPDATE
  USING (public.is_admin_or_operator() OR auth.uid() = user_id)
  WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Visualizacao de mensagens do chamado" ON public.chamado_mensagens FOR SELECT
  USING (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.chamados WHERE id = chamado_mensagens.chamado_id AND user_id = auth.uid()));
CREATE POLICY "Envio de mensagens no chamado" ON public.chamado_mensagens FOR INSERT
  WITH CHECK (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.chamados WHERE id = chamado_mensagens.chamado_id AND user_id = auth.uid()));
CREATE POLICY "Visualizacao de anexos" ON public.chamado_anexos FOR SELECT
  USING (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.chamados WHERE id = chamado_anexos.chamado_id AND user_id = auth.uid()));
CREATE POLICY "Insercao de anexos" ON public.chamado_anexos FOR INSERT
  WITH CHECK (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.chamados WHERE id = chamado_anexos.chamado_id AND user_id = auth.uid()));

ALTER TABLE public.precos_referencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precos_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem consultar precos de referencia" ON public.precos_referencia FOR SELECT USING (true);
CREATE POLICY "Admins podem gerenciar precos de referencia" ON public.precos_referencia FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Todos podem ler historico de precos" ON public.precos_historico FOR SELECT USING (true);
CREATE POLICY "Admins podem inserir historico de precos" ON public.precos_historico FOR INSERT
  WITH CHECK (public.is_admin_or_operator());

ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicado_leituras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizacao de comunicados" ON public.comunicados FOR SELECT
  USING (publicado = true OR public.is_admin_or_operator());
CREATE POLICY "Admins gerenciam comunicados" ON public.comunicados FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Usuarios registram leitura de comunicados" ON public.comunicado_leituras FOR ALL
  USING (auth.uid() = user_id OR public.is_admin_or_operator())
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_operator());

ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizacao de noticias" ON public.noticias FOR SELECT
  USING (publicado = true OR public.is_admin_or_operator());
CREATE POLICY "Admins gerenciam noticias" ON public.noticias FOR ALL
  USING (public.is_admin_or_operator()) WITH CHECK (public.is_admin_or_operator());

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Apenas Admins podem ler logs de auditoria" ON public.audit_log FOR SELECT
  USING (public.is_admin());
CREATE POLICY "Permitir insercao de logs por usuarios autenticados" ON public.audit_log FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Apenas Admins podem ler eventos de auth" ON public.auth_events FOR SELECT
  USING (public.is_admin());
CREATE POLICY "Permitir insercao de eventos de auth" ON public.auth_events FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.capacidade_diaria_abate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxas_abate ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de capacidade diaria de abate" ON public.capacidade_diaria_abate FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam capacidade diaria de abate" ON public.capacidade_diaria_abate FOR ALL
  USING (public.is_admin_or_operator()) WITH CHECK (public.is_admin_or_operator());
CREATE POLICY "Leitura de taxas de abate" ON public.taxas_abate FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam taxas de abate" ON public.taxas_abate FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.status_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de transicoes de status" ON public.status_transitions FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam transicoes de status" ON public.status_transitions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.cortes_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura do catalogo de cortes" ON public.cortes_catalogo FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam catalogo de cortes" ON public.cortes_catalogo FOR ALL
  USING (public.is_admin_or_operator()) WITH CHECK (public.is_admin_or_operator());

ALTER TABLE public.termos_de_uso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de termos de uso" ON public.termos_de_uso FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam termos de uso" ON public.termos_de_uso FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.aceites_termos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios veem seus aceites de termos" ON public.aceites_termos FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_or_operator());
CREATE POLICY "Usuarios registram aceite de termos" ON public.aceites_termos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de configuracoes do app" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam configuracoes do app" ON public.app_config FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizacao de pedidos" ON public.pedidos FOR SELECT
  USING (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Criacao de pedidos pelo cooperado ou admin" ON public.pedidos FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_operator());
CREATE POLICY "Atualizacao de pedidos por admins ou dono" ON public.pedidos FOR UPDATE
  USING (public.is_admin_or_operator() OR auth.uid() = user_id)
  WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Apenas admins podem deletar pedidos" ON public.pedidos FOR DELETE
  USING (public.is_admin());
CREATE POLICY "Visualizacao de itens do pedido" ON public.pedido_itens FOR SELECT
  USING (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.pedidos WHERE id = pedido_itens.pedido_id AND user_id = auth.uid()));
CREATE POLICY "Criacao e alteracao de itens do pedido" ON public.pedido_itens FOR ALL
  USING (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.pedidos WHERE id = pedido_itens.pedido_id AND user_id = auth.uid()));
CREATE POLICY "Visualizacao de status log de pedido" ON public.pedido_status_log FOR SELECT
  USING (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.pedidos WHERE id = pedido_status_log.pedido_id AND user_id = auth.uid()));
CREATE POLICY "Insercao de status log de pedido" ON public.pedido_status_log FOR INSERT WITH CHECK (true);

ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotacao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizacao de cotacoes" ON public.cotacoes FOR SELECT
  USING (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Criacao de cotacoes" ON public.cotacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_operator());
CREATE POLICY "Atualizacao de cotacoes" ON public.cotacoes FOR UPDATE
  USING (public.is_admin_or_operator() OR auth.uid() = user_id)
  WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Apenas admins deletam cotacoes" ON public.cotacoes FOR DELETE USING (public.is_admin());
CREATE POLICY "Visualizacao de itens de cotacao" ON public.cotacao_itens FOR SELECT
  USING (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.cotacoes WHERE id = cotacao_itens.cotacao_id AND user_id = auth.uid()));
CREATE POLICY "Criacao de itens de cotacao" ON public.cotacao_itens FOR ALL
  USING (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.cotacoes WHERE id = cotacao_itens.cotacao_id AND user_id = auth.uid()));

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizacao de documentos" ON public.documentos FOR SELECT
  USING (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Gerenciamento de documentos" ON public.documentos FOR ALL
  USING (public.is_admin_or_operator() OR auth.uid() = user_id)
  WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Visualizacao de solicitacoes de documento" ON public.documento_solicitacoes FOR SELECT
  USING (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Gerenciamento de solicitacoes de documento" ON public.documento_solicitacoes FOR ALL
  USING (public.is_admin_or_operator() OR auth.uid() = user_id)
  WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);

ALTER TABLE public.sugestoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizacao de sugestoes" ON public.sugestoes FOR SELECT
  USING (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Criacao de sugestoes" ON public.sugestoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins gerenciam sugestoes" ON public.sugestoes FOR UPDATE
  USING (public.is_admin_or_operator()) WITH CHECK (public.is_admin_or_operator());

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios podem ver suas proprias notificacoes" ON public.notificacoes FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_or_operator());
CREATE POLICY "Admins e Operadores podem criar notificacoes" ON public.notificacoes FOR INSERT
  WITH CHECK (public.is_admin_or_operator() OR auth.uid() = user_id);
CREATE POLICY "Usuarios podem marcar suas notificacoes como lidas" ON public.notificacoes FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin_or_operator())
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_operator());
CREATE POLICY "Admins e usuarios podem deletar suas notificacoes" ON public.notificacoes FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam seus dispositivos" ON public.user_devices FOR ALL
  USING (auth.uid() = user_id OR public.is_admin_or_operator())
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam seu onboarding" ON public.user_onboarding FOR ALL
  USING (auth.uid() = user_id OR public.is_admin_or_operator())
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam suas preferencias" ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_private_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios veem seus dados privados" ON public.user_private_data FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_or_operator());
CREATE POLICY "Usuarios gerenciam seus dados privados" ON public.user_private_data FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- profiles_public é uma view (RLS herda da tabela base profiles automaticamente
-- via security_invoker se necessário); garantimos leitura para autenticados:
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- ==============================================================================
-- 7. STORAGE BUCKETS
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('chamados', 'chamados', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('noticias', 'noticias', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Permitir upload em chamados por usuarios autenticados" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chamados' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir download publico de arquivos de chamados" ON storage.objects FOR SELECT
  USING (bucket_id = 'chamados');

CREATE POLICY "Permitir upload de documentos por autenticados" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura de documentos" ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos');

CREATE POLICY "Permitir upload de imagens de noticias por autenticados" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'noticias' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura publica de imagens de noticias" ON storage.objects FOR SELECT
  USING (bucket_id = 'noticias');

-- ==============================================================================
-- 8. GRANTS
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
