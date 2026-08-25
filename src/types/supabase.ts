export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      aceites_termos: {
        Row: {
          aceito_at: string
          id: string
          ip_address: unknown
          termo_id: string
          user_id: string
        }
        Insert: {
          aceito_at?: string
          id?: string
          ip_address?: unknown
          termo_id: string
          user_id: string
        }
        Update: {
          aceito_at?: string
          id?: string
          ip_address?: unknown
          termo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aceites_termos_termo_id_fkey"
            columns: ["termo_id"]
            isOneToOne: false
            referencedRelation: "termos_de_uso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aceites_termos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aceites_termos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamento_status_log: {
        Row: {
          agendamento_id: string
          alterado_por: string | null
          created_at: string
          id: string
          motivo: string | null
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          agendamento_id: string
          alterado_por?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          agendamento_id?: string
          alterado_por?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_status_log_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos_abate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_status_log_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_status_log_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos_abate: {
        Row: {
          aprovado_at: string | null
          aprovado_por: string | null
          created_at: string
          data_abate: string
          deleted_at: string | null
          id: string
          observacoes: string | null
          quantidade: number
          rendimento_medio: number | null
          requer_aprovacao: boolean
          romaneio_url: string | null
          status: string
          tipo_animal: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aprovado_at?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_abate: string
          deleted_at?: string | null
          id?: string
          observacoes?: string | null
          quantidade: number
          rendimento_medio?: number | null
          requer_aprovacao?: boolean
          romaneio_url?: string | null
          status?: string
          tipo_animal: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aprovado_at?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_abate?: string
          deleted_at?: string | null
          id?: string
          observacoes?: string | null
          quantidade?: number
          rendimento_medio?: number | null
          requer_aprovacao?: boolean
          romaneio_url?: string | null
          status?: string
          tipo_animal?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_abate_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_abate_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_abate_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_abate_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_preco: {
        Row: {
          ativo: boolean
          condicao: string
          created_at: string
          deleted_at: string | null
          disparado_at: string | null
          id: string
          tipo_animal: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          condicao: string
          created_at?: string
          deleted_at?: string | null
          disparado_at?: string | null
          id?: string
          tipo_animal: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          ativo?: boolean
          condicao?: string
          created_at?: string
          deleted_at?: string | null
          disparado_at?: string | null
          id?: string
          tipo_animal?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "alertas_preco_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_preco_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          chave: string
          created_at: string
          descricao: string | null
          editavel: boolean
          id: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string | null
          editavel?: boolean
          id?: string
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string | null
          editavel?: boolean
          id?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: unknown
          registro_id: string | null
          tabela: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: unknown
          registro_id?: string | null
          tabela: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: unknown
          registro_id?: string | null
          tabela?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      capacidade_diaria_abate: {
        Row: {
          capacidade_total: number
          created_at: string
          data: string
          id: string
          ocupado: number
          tipo_animal: string
          updated_at: string
        }
        Insert: {
          capacidade_total: number
          created_at?: string
          data: string
          id?: string
          ocupado?: number
          tipo_animal: string
          updated_at?: string
        }
        Update: {
          capacidade_total?: number
          created_at?: string
          data?: string
          id?: string
          ocupado?: number
          tipo_animal?: string
          updated_at?: string
        }
        Relationships: []
      }
      chamado_anexos: {
        Row: {
          arquivo_url: string
          chamado_id: string
          created_at: string
          id: string
          mensagem_id: string | null
          mime_type: string | null
          nome_arquivo: string
          tamanho: number | null
          uploaded_por: string
        }
        Insert: {
          arquivo_url: string
          chamado_id: string
          created_at?: string
          id?: string
          mensagem_id?: string | null
          mime_type?: string | null
          nome_arquivo: string
          tamanho?: number | null
          uploaded_por: string
        }
        Update: {
          arquivo_url?: string
          chamado_id?: string
          created_at?: string
          id?: string
          mensagem_id?: string | null
          mime_type?: string | null
          nome_arquivo?: string
          tamanho?: number | null
          uploaded_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamado_anexos_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamado_anexos_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "chamado_mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamado_anexos_uploaded_por_fkey"
            columns: ["uploaded_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamado_anexos_uploaded_por_fkey"
            columns: ["uploaded_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      chamado_mensagens: {
        Row: {
          chamado_id: string
          created_at: string
          id: string
          remetente_id: string
          remetente_tipo: string
          texto: string
        }
        Insert: {
          chamado_id: string
          created_at?: string
          id?: string
          remetente_id: string
          remetente_tipo: string
          texto: string
        }
        Update: {
          chamado_id?: string
          created_at?: string
          id?: string
          remetente_id?: string
          remetente_tipo?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamado_mensagens_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamado_mensagens_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamado_mensagens_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados: {
        Row: {
          assunto: string
          atribuido_a: string | null
          categoria: string
          codigo: string
          created_at: string
          deleted_at: string | null
          descricao: string
          id: string
          prioridade: string
          resolvido_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assunto: string
          atribuido_a?: string | null
          categoria: string
          codigo: string
          created_at?: string
          deleted_at?: string | null
          descricao: string
          id?: string
          prioridade?: string
          resolvido_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assunto?: string
          atribuido_a?: string | null
          categoria?: string
          codigo?: string
          created_at?: string
          deleted_at?: string | null
          descricao?: string
          id?: string
          prioridade?: string
          resolvido_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_atribuido_a_fkey"
            columns: ["atribuido_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_atribuido_a_fkey"
            columns: ["atribuido_a"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicado_leituras: {
        Row: {
          comunicado_id: string
          id: string
          lido_at: string
          user_id: string
        }
        Insert: {
          comunicado_id: string
          id?: string
          lido_at?: string
          user_id: string
        }
        Update: {
          comunicado_id?: string
          id?: string
          lido_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicado_leituras_comunicado_id_fkey"
            columns: ["comunicado_id"]
            isOneToOne: false
            referencedRelation: "comunicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicado_leituras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicado_leituras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicados: {
        Row: {
          created_at: string
          data_publicacao: string | null
          deleted_at: string | null
          destinatario_perfil: string | null
          id: string
          mensagem: string
          publicado: boolean
          publicado_por: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_publicacao?: string | null
          deleted_at?: string | null
          destinatario_perfil?: string | null
          id?: string
          mensagem: string
          publicado?: boolean
          publicado_por?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_publicacao?: string | null
          deleted_at?: string | null
          destinatario_perfil?: string | null
          id?: string
          mensagem?: string
          publicado?: boolean
          publicado_por?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_publicado_por_fkey"
            columns: ["publicado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicados_publicado_por_fkey"
            columns: ["publicado_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cortes_catalogo: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          tipo_carne: string
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tipo_carne: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tipo_carne?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      cotacao_itens: {
        Row: {
          cotacao_id: string
          created_at: string
          descricao: string
          id: string
          quantidade: number
          unidade: string
        }
        Insert: {
          cotacao_id: string
          created_at?: string
          descricao: string
          id?: string
          quantidade: number
          unidade?: string
        }
        Update: {
          cotacao_id?: string
          created_at?: string
          descricao?: string
          id?: string
          quantidade?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotacao_itens_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes: {
        Row: {
          codigo: string
          created_at: string
          deleted_at: string | null
          id: string
          observacao_resposta: string | null
          observacoes: string | null
          prazo_resposta: string | null
          respondido_at: string | null
          respondido_por: string | null
          status: string
          tipo_produto: string
          unidade_negociada: string | null
          updated_at: string
          user_id: string
          validade: string | null
          valor_negociado: number | null
        }
        Insert: {
          codigo: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          observacao_resposta?: string | null
          observacoes?: string | null
          prazo_resposta?: string | null
          respondido_at?: string | null
          respondido_por?: string | null
          status?: string
          tipo_produto: string
          unidade_negociada?: string | null
          updated_at?: string
          user_id: string
          validade?: string | null
          valor_negociado?: number | null
        }
        Update: {
          codigo?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          observacao_resposta?: string | null
          observacoes?: string | null
          prazo_resposta?: string | null
          respondido_at?: string | null
          respondido_por?: string | null
          status?: string
          tipo_produto?: string
          unidade_negociada?: string | null
          updated_at?: string
          user_id?: string
          validade?: string | null
          valor_negociado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_respondido_por_fkey"
            columns: ["respondido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_respondido_por_fkey"
            columns: ["respondido_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_solicitacoes: {
        Row: {
          atendido_por: string | null
          created_at: string
          documento_id: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string
          tipo_documento: string
          updated_at: string
          user_id: string
        }
        Insert: {
          atendido_por?: string | null
          created_at?: string
          documento_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string
          tipo_documento: string
          updated_at?: string
          user_id: string
        }
        Update: {
          atendido_por?: string | null
          created_at?: string
          documento_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string
          tipo_documento?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_solicitacoes_atendido_por_fkey"
            columns: ["atendido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_solicitacoes_atendido_por_fkey"
            columns: ["atendido_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_solicitacoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_solicitacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_solicitacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          agendamento_id: string | null
          arquivo_tamanho: number | null
          arquivo_url: string | null
          created_at: string
          deleted_at: string | null
          id: string
          mime_type: string | null
          nome: string
          pedido_id: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agendamento_id?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          mime_type?: string | null
          nome: string
          pedido_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agendamento_id?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          mime_type?: string | null
          nome?: string
          pedido_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos_abate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      estabelecimentos: {
        Row: {
          cidade: string
          cnpj: string
          created_at: string
          deleted_at: string | null
          endereco: string | null
          estado: string
          id: string
          razao_social: string
          tipo_estabelecimento: string
          updated_at: string
        }
        Insert: {
          cidade: string
          cnpj: string
          created_at?: string
          deleted_at?: string | null
          endereco?: string | null
          estado: string
          id?: string
          razao_social: string
          tipo_estabelecimento: string
          updated_at?: string
        }
        Update: {
          cidade?: string
          cnpj?: string
          created_at?: string
          deleted_at?: string | null
          endereco?: string | null
          estado?: string
          id?: string
          razao_social?: string
          tipo_estabelecimento?: string
          updated_at?: string
        }
        Relationships: []
      }
      limites_abate: {
        Row: {
          abates_realizados: number
          created_at: string
          id: string
          limite_mensal: number
          mes_referencia: string
          tipo_animal: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abates_realizados?: number
          created_at?: string
          id?: string
          limite_mensal: number
          mes_referencia: string
          tipo_animal: string
          updated_at?: string
          user_id: string
        }
        Update: {
          abates_realizados?: number
          created_at?: string
          id?: string
          limite_mensal?: number
          mes_referencia?: string
          tipo_animal?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "limites_abate_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "limites_abate_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias: {
        Row: {
          conteudo: string
          created_at: string
          data_publicacao: string | null
          deleted_at: string | null
          destaque: boolean
          id: string
          imagem_url: string | null
          publicado: boolean
          publicado_por: string | null
          resumo: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          data_publicacao?: string | null
          deleted_at?: string | null
          destaque?: boolean
          id?: string
          imagem_url?: string | null
          publicado?: boolean
          publicado_por?: string | null
          resumo: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          data_publicacao?: string | null
          deleted_at?: string | null
          destaque?: boolean
          id?: string
          imagem_url?: string | null
          publicado?: boolean
          publicado_por?: string | null
          resumo?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "noticias_publicado_por_fkey"
            columns: ["publicado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noticias_publicado_por_fkey"
            columns: ["publicado_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          action_url: string | null
          categoria: string
          created_at: string
          id: string
          lida: boolean
          lida_at: string | null
          mensagem: string
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          categoria: string
          created_at?: string
          id?: string
          lida?: boolean
          lida_at?: string | null
          mensagem: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          categoria?: string
          created_at?: string
          id?: string
          lida?: boolean
          lida_at?: string | null
          mensagem?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          corte: string
          created_at: string
          id: string
          pedido_id: string
          preco_unitario: number
          quantidade_kg: number
          subtotal: number
        }
        Insert: {
          corte: string
          created_at?: string
          id?: string
          pedido_id: string
          preco_unitario: number
          quantidade_kg: number
          subtotal?: number
        }
        Update: {
          corte?: string
          created_at?: string
          id?: string
          pedido_id?: string
          preco_unitario?: number
          quantidade_kg?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_status_log: {
        Row: {
          alterado_por: string | null
          created_at: string
          id: string
          motivo: string | null
          pedido_id: string
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          alterado_por?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          pedido_id: string
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          alterado_por?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          pedido_id?: string
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_status_log_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_status_log_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_status_log_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          codigo: string
          comprovante_url: string | null
          cotacao_id: string | null
          created_at: string
          data_entrega_desejada: string | null
          deleted_at: string | null
          duplicado_de: string | null
          id: string
          local_entrega: string | null
          observacoes: string | null
          status: string
          tipo_carne: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo: string
          comprovante_url?: string | null
          cotacao_id?: string | null
          created_at?: string
          data_entrega_desejada?: string | null
          deleted_at?: string | null
          duplicado_de?: string | null
          id?: string
          local_entrega?: string | null
          observacoes?: string | null
          status?: string
          tipo_carne: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo?: string
          comprovante_url?: string | null
          cotacao_id?: string | null
          created_at?: string
          data_entrega_desejada?: string | null
          deleted_at?: string | null
          duplicado_de?: string | null
          id?: string
          local_entrega?: string | null
          observacoes?: string | null
          status?: string
          tipo_carne?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_duplicado_de_fkey"
            columns: ["duplicado_de"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      precos_historico: {
        Row: {
          created_at: string
          data: string
          fonte: string | null
          id: string
          produto: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          fonte?: string | null
          id?: string
          produto: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          fonte?: string | null
          id?: string
          produto?: string
          valor?: number
        }
        Relationships: []
      }
      precos_referencia: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          data_referencia: string
          id: string
          produto: string
          unidade: string
          updated_at: string
          valor: number
          variacao_percentual: number | null
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          data_referencia: string
          id?: string
          produto: string
          unidade: string
          updated_at?: string
          valor: number
          variacao_percentual?: number | null
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          data_referencia?: string
          id?: string
          produto?: string
          unidade?: string
          updated_at?: string
          valor?: number
          variacao_percentual?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          created_at: string
          data_nascimento: string | null
          deleted_at: string | null
          email: string
          estabelecimento_id: string | null
          id: string
          nome: string
          perfil: string
          telefone: string | null
          updated_at: string
          verificado: boolean
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          data_nascimento?: string | null
          deleted_at?: string | null
          email: string
          estabelecimento_id?: string | null
          id: string
          nome: string
          perfil?: string
          telefone?: string | null
          updated_at?: string
          verificado?: boolean
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          data_nascimento?: string | null
          deleted_at?: string | null
          email?: string
          estabelecimento_id?: string | null
          id?: string
          nome?: string
          perfil?: string
          telefone?: string | null
          updated_at?: string
          verificado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      status_transitions: {
        Row: {
          created_at: string
          entidade: string
          id: string
          requer_admin: boolean
          status_de: string
          status_para: string
        }
        Insert: {
          created_at?: string
          entidade: string
          id?: string
          requer_admin?: boolean
          status_de: string
          status_para: string
        }
        Update: {
          created_at?: string
          entidade?: string
          id?: string
          requer_admin?: boolean
          status_de?: string
          status_para?: string
        }
        Relationships: []
      }
      sugestoes: {
        Row: {
          categoria: string
          created_at: string
          deleted_at: string | null
          id: string
          lida: boolean
          lida_at: string | null
          lida_por: string | null
          resposta: string | null
          texto: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          lida?: boolean
          lida_at?: string | null
          lida_por?: string | null
          resposta?: string | null
          texto: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          lida?: boolean
          lida_at?: string | null
          lida_por?: string | null
          resposta?: string | null
          texto?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sugestoes_lida_por_fkey"
            columns: ["lida_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sugestoes_lida_por_fkey"
            columns: ["lida_por"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sugestoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sugestoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      taxas_abate: {
        Row: {
          ativo: boolean
          created_at: string
          especie: string
          id: string
          unidade: string
          updated_at: string
          valor_cooperado: number
          valor_terceiro: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          especie: string
          id?: string
          unidade?: string
          updated_at?: string
          valor_cooperado: number
          valor_terceiro: number
          vigencia_fim?: string | null
          vigencia_inicio: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          especie?: string
          id?: string
          unidade?: string
          updated_at?: string
          valor_cooperado?: number
          valor_terceiro?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      termos_de_uso: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          id: string
          titulo: string
          versao: string
          vigente_desde: string
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          id?: string
          titulo: string
          versao: string
          vigente_desde?: string
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          id?: string
          titulo?: string
          versao?: string
          vigente_desde?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          ativo: boolean
          created_at: string
          device_name: string | null
          id: string
          last_active_at: string | null
          platform: string
          push_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          device_name?: string | null
          id?: string
          last_active_at?: string | null
          platform: string
          push_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          device_name?: string | null
          id?: string
          last_active_at?: string | null
          platform?: string
          push_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          concluido: boolean
          concluido_at: string | null
          created_at: string
          etapa_atual: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concluido?: boolean
          concluido_at?: string | null
          created_at?: string
          etapa_atual?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concluido?: boolean
          concluido_at?: string | null
          created_at?: string
          etapa_atual?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          notificacoes_email: boolean
          notificacoes_push: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notificacoes_email?: boolean
          notificacoes_push?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notificacoes_email?: boolean
          notificacoes_push?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_private_data: {
        Row: {
          aceite_termos_at: string | null
          cpf: string
          created_at: string
          id: string
          interesse_volume: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aceite_termos_at?: string | null
          cpf: string
          created_at?: string
          id?: string
          interesse_volume?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aceite_termos_at?: string | null
          cpf?: string
          created_at?: string
          id?: string
          interesse_volume?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_private_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_private_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          estabelecimento_id: string | null
          id: string | null
          nome: string | null
          perfil: string | null
          verificado: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          estabelecimento_id?: string | null
          id?: string | null
          nome?: string | null
          perfil?: string | null
          verificado?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          estabelecimento_id?: string | null
          id?: string | null
          nome?: string | null
          perfil?: string | null
          verificado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_sequential_code: {
        Args: { prefix: string; table_name: string }
        Returns: string
      }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
