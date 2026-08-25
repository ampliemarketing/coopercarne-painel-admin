import { supabase, isSupabaseReady } from '../lib/supabase';
import type { Ticket, TicketMessage, TicketAttachment } from '../types';

export const ticketService = {
  /**
   * Busca todos os chamados com seus dados relacionais (profiles, mensagens e anexos)
   */
  async getTickets(): Promise<Ticket[]> {
    if (!isSupabaseReady()) return [];

    try {
      const [chamadosRes, mensagensRes, anexosRes] = await Promise.all([
        supabase
          .from('chamados')
          .select(`
            id,
            codigo,
            user_id,
            assunto,
            descricao,
            categoria,
            prioridade,
            status,
            atribuido_a,
            resolvido_at,
            created_at,
            updated_at,
            profiles!chamados_user_id_fkey (
              id,
              nome,
              email,
              perfil,
              estabelecimentos (
                razao_social
              )
            )
          `)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false }),
        supabase
          .from('chamado_mensagens')
          .select(`
            id,
            chamado_id,
            remetente_id,
            remetente_tipo,
            texto,
            created_at,
            profiles (
              nome,
              perfil
            )
          `)
          .order('created_at', { ascending: true }),
        supabase
          .from('chamado_anexos')
          .select('*')
          .order('created_at', { ascending: true }),
      ]);

      if (chamadosRes.error) {
        console.error('[ticketService] Erro ao buscar chamados:', chamadosRes.error.message);
        throw chamadosRes.error;
      }

      const allMessages = mensagensRes.data || [];
      const allAnexos = anexosRes.data || [];
      const rows = chamadosRes.data || [];

      return rows.map((c: any) => {
        const prof = c.profiles;
        const estab = prof?.estabelecimentos;
        const isTerceiro = prof?.perfil === 'terceiro';
        const producerName = prof?.nome || estab?.razao_social || 'Produtor COOPERCARNE';

        // Anexos vinculados ao chamado
        const ticketAnexos: TicketAttachment[] = allAnexos
          .filter((a: any) => a.chamado_id === c.id)
          .map((a: any) => ({
            id: a.id,
            chamadoId: a.chamado_id,
            fileName: a.nome_arquivo,
            fileUrl: a.arquivo_url,
            mimeType: a.mime_type || undefined,
            fileSize: a.tamanho || undefined,
            uploadedAt: new Date(a.created_at).toLocaleString('pt-BR'),
          }));

        // Mensagens do chamado
        const ticketMsgs: TicketMessage[] = allMessages
          .filter((m: any) => m.chamado_id === c.id)
          .map((m: any) => {
            const senderType = (m.remetente_tipo === 'admin' ? 'admin' : isTerceiro ? 'terceiro' : 'cooperado') as 'admin' | 'cooperado' | 'terceiro';
            const msgDate = new Date(m.created_at);
            const formattedTime = !isNaN(msgDate.getTime())
              ? msgDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : '12:00';

            return {
              id: m.id,
              sender: senderType,
              senderName: m.profiles?.nome || (senderType === 'admin' ? 'Atendimento COOPERCARNE' : producerName),
              text: m.texto,
              timestamp: formattedTime,
            };
          });

        // Se o chamado tiver descrição inicial e nenhuma mensagem, injeta a mensagem inicial
        if (ticketMsgs.length === 0 && c.descricao) {
          const initDate = new Date(c.created_at);
          ticketMsgs.push({
            id: `init-${c.id}`,
            sender: isTerceiro ? 'terceiro' : 'cooperado',
            senderName: producerName,
            text: c.descricao,
            timestamp: !isNaN(initDate.getTime())
              ? initDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : '08:00',
          });
        }

        let uiStatus: Ticket['status'] = 'aberto';
        if (c.status === 'resolvido' || c.resolvido_at) {
          uiStatus = 'resolvido';
        } else if (c.status === 'em_andamento' || c.status === 'em_atendimento') {
          uiStatus = 'em_atendimento';
        }

        const rawUpdated = new Date(c.updated_at || c.created_at);
        const formattedUpdated = !isNaN(rawUpdated.getTime())
          ? rawUpdated.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
          : 'Hoje';

        return {
          id: c.id,
          code: c.codigo || `TK-${c.id.substring(0, 4).toUpperCase()}`,
          userId: c.user_id,
          userName: producerName,
          userType: isTerceiro ? 'terceiro' : 'cooperado',
          subject: c.assunto,
          description: c.descricao,
          category: c.categoria || 'Geral',
          status: uiStatus,
          priority: (c.prioridade?.toLowerCase() || 'media') as 'baixa' | 'media' | 'alta',
          updatedAt: formattedUpdated,
          createdAt: c.created_at,
          resolvedAt: c.resolvido_at || undefined,
          messages: ticketMsgs,
          attachments: ticketAnexos,
        };
      });
    } catch (err) {
      console.error('[ticketService] Erro ao carregar chamados:', err);
      throw err;
    }
  },

  /**
   * Envia uma nova mensagem no chat do chamado
   */
  async sendMessage(
    chamadoId: string,
    text: string,
    senderId: string,
    senderTipo: string = 'admin'
  ): Promise<TicketMessage> {
    const generatedId = crypto.randomUUID();
    const now = new Date();

    const { error: msgError } = await supabase.from('chamado_mensagens').insert({
      id: generatedId,
      chamado_id: chamadoId,
      remetente_id: senderId,
      remetente_tipo: senderTipo,
      texto: text,
      created_at: now.toISOString(),
    });

    if (msgError) {
      console.error('[ticketService] Erro ao enviar mensagem:', msgError.message);
      throw msgError;
    }

    // Atualiza status do chamado para em_atendimento se estiver aberto
    await supabase
      .from('chamados')
      .update({
        status: 'em_andamento',
        updated_at: now.toISOString(),
      })
      .eq('id', chamadoId)
      .eq('status', 'aberto');

    // Registra log
    await supabase.from('audit_log').insert({
      acao: 'ENVIAR_MENSAGEM_CHAMADO',
      tabela: 'chamado_mensagens',
      registro_id: generatedId,
      dados_novos: { chamado_id: chamadoId, remetente_tipo: senderTipo },
    });

    return {
      id: generatedId,
      sender: senderTipo as any,
      senderName: senderTipo === 'admin' ? 'Atendimento COOPERCARNE' : 'Produtor',
      text,
      timestamp: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  },

  /**
   * Atualiza o status do chamado (Aberto, Em Atendimento, Resolvido)
   */
  async updateStatus(
    chamadoId: string,
    newStatus: 'aberto' | 'em_atendimento' | 'resolvido',
    adminId?: string
  ): Promise<void> {
    const isResolvido = newStatus === 'resolvido';
    const dbStatus = newStatus === 'em_atendimento' ? 'em_andamento' : newStatus;

    const payload: any = {
      status: dbStatus,
      updated_at: new Date().toISOString(),
    };

    if (isResolvido) {
      payload.resolvido_at = new Date().toISOString();
    } else {
      payload.resolvido_at = null;
    }

    if (adminId) {
      payload.atribuido_a = adminId;
    }

    const { error } = await supabase
      .from('chamados')
      .update(payload)
      .eq('id', chamadoId);

    if (error) {
      console.error('[ticketService] Erro ao atualizar status:', error.message);
      throw error;
    }

    await supabase.from('audit_log').insert({
      acao: `STATUS_CHAMADO_${newStatus.toUpperCase()}`,
      tabela: 'chamados',
      registro_id: chamadoId,
      dados_novos: { status: dbStatus },
    });
  },

  /**
   * Faz upload de anexo no Supabase Storage e salva em chamado_anexos
   */
  async uploadAttachment(
    chamadoId: string,
    file: File,
    uploaderId: string
  ): Promise<TicketAttachment> {
    const fileExt = file.name.split('.').pop();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `chamados/${chamadoId}/${Date.now()}_${cleanFileName}`;

    let publicUrl = '';

    try {
      const { error: uploadError } = await supabase.storage
        .from('chamados')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.warn('[ticketService] Aviso no bucket chamados (tentando documentos):', uploadError.message);
        // Fallback para bucket público 'documentos' caso 'chamados' não exista
        const { error: docError } = await supabase.storage
          .from('documentos')
          .upload(filePath, file, { upsert: true });

        if (docError) throw docError;
        const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      } else {
        const { data: urlData } = supabase.storage.from('chamados').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }
    } catch (storageErr: any) {
      console.warn('[ticketService] Storage upload fallback simulado:', storageErr?.message);
      publicUrl = URL.createObjectURL(file);
    }

    const generatedId = crypto.randomUUID();

    const { error: insertError } = await supabase.from('chamado_anexos').insert({
      id: generatedId,
      chamado_id: chamadoId,
      nome_arquivo: file.name,
      arquivo_url: publicUrl,
      mime_type: file.type || fileExt,
      tamanho: file.size,
      uploaded_por: uploaderId,
    });

    if (insertError) {
      console.warn('[ticketService] Erro ao gravar chamado_anexos:', insertError.message);
    }

    return {
      id: generatedId,
      chamadoId,
      fileName: file.name,
      fileUrl: publicUrl,
      mimeType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toLocaleString('pt-BR'),
    };
  },
};
