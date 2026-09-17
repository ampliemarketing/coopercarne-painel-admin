-- ==============================================================================
-- Controle de estoque da câmara fria por LOTE, com regra sanitária de validade
-- (6 dias a partir da finalização do abate) e consumo FEFO (First-Expired-First-Out).
--
-- Conceito:
--   - Cada agendamento de abate finalizado (agendamentos_abate.status_operacional =
--     'finalizado') é um LOTE de estoque, com validade = finalizado_em + 6 dias.
--   - Toda saída de estoque (entrega de pedido) é registrada como uma linha em
--     camara_fria_movimentos, referenciando de qual lote (agendamento) ela saiu.
--   - O saldo de um lote é sempre: peças geradas no abate − soma de tudo que já
--     foi registrado em camara_fria_movimentos para esse lote. Isso permite baixas
--     PARCIAIS e sucessivas do mesmo lote (ex: retira 2+2 hoje, mais 8 depois),
--     sem nunca "fechar" o lote antes do saldo zerar.
--   - Ao processar uma entrega, o sistema consome sempre do lote mais antigo (mais
--     próximo de vencer) primeiro, podendo consumir de vários lotes numa mesma
--     entrega se o mais antigo não for suficiente.
-- ==============================================================================

-- Classificação estruturada por item de pedido (em vez de depender só do texto
-- livre em "corte"), necessária para saber de qual espécie/parte descontar.
ALTER TABLE public.pedido_itens
  ADD COLUMN tipo_animal text,
  ADD COLUMN tipo_peca text,
  ADD COLUMN quantidade_pecas integer NOT NULL DEFAULT 1;

ALTER TABLE public.pedido_itens
  ADD CONSTRAINT chk_pedido_itens_tipo_peca CHECK (
    tipo_peca IS NULL OR tipo_peca IN ('dianteiro', 'traseiro', 'unidade')
  );

COMMENT ON COLUMN public.pedido_itens.tipo_animal IS 'Espécie do item para fins de baixa na câmara fria (bovino/suino/cordeiro/leitao); nulo para itens não rastreados por lote (ex: miúdos).';
COMMENT ON COLUMN public.pedido_itens.tipo_peca IS 'dianteiro/traseiro (bovino, suíno, cordeiro) ou unidade (leitão, controlado por cabeça).';
COMMENT ON COLUMN public.pedido_itens.quantidade_pecas IS 'Quantidade de peças/cabeças deste item, usada para o desconto FEFO no estoque da câmara fria.';

-- Ledger de movimentações de saída da câmara fria, por lote (agendamento de abate).
CREATE TABLE public.camara_fria_movimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id uuid NOT NULL REFERENCES public.agendamentos_abate(id),
  pedido_id uuid REFERENCES public.pedidos(id),
  pedido_item_id uuid REFERENCES public.pedido_itens(id),
  tipo_animal text NOT NULL,
  tipo_peca text NOT NULL CHECK (tipo_peca IN ('dianteiro', 'traseiro', 'unidade')),
  quantidade integer NOT NULL CHECK (quantidade > 0),
  criado_por uuid REFERENCES public.profiles(id),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.camara_fria_movimentos IS 'Ledger de saídas de estoque da câmara fria por lote (agendamento). O saldo de um lote é sempre calculado como peças geradas menos a soma das movimentações desse lote — nunca um flag binário, para suportar baixas parciais sucessivas (FEFO).';

CREATE INDEX idx_camara_fria_movimentos_agendamento ON public.camara_fria_movimentos(agendamento_id, tipo_peca);
CREATE INDEX idx_camara_fria_movimentos_pedido ON public.camara_fria_movimentos(pedido_id);

ALTER TABLE public.camara_fria_movimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visualizacao de movimentos da camara fria" ON public.camara_fria_movimentos FOR SELECT
  USING (public.is_admin_or_operator() OR EXISTS (
    SELECT 1 FROM public.agendamentos_abate WHERE id = camara_fria_movimentos.agendamento_id AND user_id = auth.uid()));

CREATE POLICY "Insercao de movimentos da camara fria" ON public.camara_fria_movimentos FOR INSERT
  WITH CHECK (public.is_admin_or_operator());

CREATE POLICY "Apenas admins deletam movimentos da camara fria" ON public.camara_fria_movimentos FOR DELETE
  USING (public.is_admin());
