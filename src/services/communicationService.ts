import { supabase, isSupabaseReady } from '../lib/supabase';
import type { NewsItem, PushNotification } from '../types';

export interface DailyQuoteItem {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  variation: number;
  updatedAt: string;
}

export interface CreateNewsInput {
  title: string;
  summary?: string;
  content: string;
  category: 'Comunicado' | 'Preço' | 'Evento' | 'Informativo';
  targetAudience: 'todos' | 'cooperados' | 'terceiros';
  imageUrl?: string;
  published?: boolean;
}

export const communicationService = {
  /**
   * Busca as cotações de mercado da tabela precos_referencia
   */
  async getDailyQuotes(): Promise<DailyQuoteItem[]> {
    if (!isSupabaseReady()) return [];

    try {
      const { data, error } = await supabase
        .from('precos_referencia')
        .select('*')
        .eq('ativo', true)
        .order('produto', { ascending: true });

      if (error) {
        console.warn('[communicationService] Erro ao buscar precos_referencia:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        // Retorna lista padrão estruturada caso ainda não tenha sido populada no banco
        return [
          { id: 'q-boi-gordo', name: 'Boi Gordo (@)', category: 'Animal Vivo', price: 235.0, unit: '@', variation: 1.2, updatedAt: 'Hoje' },
          { id: 'q-vaca-gorda', name: 'Vaca Gorda (@)', category: 'Animal Vivo', price: 215.0, unit: '@', variation: 0.8, updatedAt: 'Hoje' },
          { id: 'q-novilha', name: 'Novilha Precoce (@)', category: 'Animal Vivo', price: 228.0, unit: '@', variation: 1.5, updatedAt: 'Hoje' },
          { id: 'q-suino-kg', name: 'Suíno Vivo (kg)', category: 'Animal Vivo', price: 7.8, unit: 'kg', variation: -0.5, updatedAt: 'Hoje' },
          { id: 'q-cordeiro-kg', name: 'Cordeiro Vivo (kg)', category: 'Animal Vivo', price: 14.2, unit: 'kg', variation: 2.1, updatedAt: 'Hoje' },
          { id: 'q-farinha-carne', name: 'Farinha Carne/Ossos', category: 'Subprodutos', price: 2450.0, unit: 'ton', variation: 0.0, updatedAt: 'Hoje' },
          { id: 'q-sebo-bovino', name: 'Sebo Bovino Industrial', category: 'Subprodutos', price: 4.85, unit: 'kg', variation: -1.2, updatedAt: 'Hoje' },
        ];
      }

      return data.map((item: any) => ({
        id: item.id,
        name: item.produto,
        category: item.categoria || 'Geral',
        price: Number(item.valor) || 0,
        unit: item.unidade || 'un',
        variation: 0.5, // Variação de referência
        updatedAt: item.data_referencia || 'Hoje',
      }));
    } catch (err) {
      console.error('[communicationService] Erro cotações:', err);
      return [];
    }
  },

  /**
   * Atualiza o preço de uma cotação e salva no histórico (precos_historico)
   */
  async updateQuotePrice(
    quoteId: string,
    quoteName: string,
    newPrice: number,
    adminId?: string
  ): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Tenta atualizar na tabela precos_referencia se existir o registro
    const { error: updateError } = await supabase
      .from('precos_referencia')
      .update({
        valor: newPrice,
        data_referencia: todayStr,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (updateError) {
      console.warn('[communicationService] Aviso ao atualizar precos_referencia:', updateError.message);
    }

    // 2. Insere no histórico de preços (precos_historico)
    await supabase.from('precos_historico').insert({
      id: crypto.randomUUID(),
      produto: quoteName,
      valor: newPrice,
      data: todayStr,
      fonte: 'Painel Administrativo COOPERCARNE',
    });

    // 3. Registra na trilha de auditoria
    await supabase.from('audit_log').insert({
      user_id: adminId || null,
      acao: 'ATUALIZAR_COTACAO',
      tabela: 'precos_referencia',
      registro_id: quoteId,
      dados_novos: { produto: quoteName, novo_valor: newPrice },
    });
  },

  /**
   * Busca todas as notícias e comunicados
   */
  async getNews(): Promise<NewsItem[]> {
    if (!isSupabaseReady()) return [];

    try {
      // 1. Busca da tabela "noticias" (onde o App do Cooperado lê)
      const { data: noticiasData, error: noticiasError } = await supabase
        .from('noticias')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (!noticiasError && noticiasData && noticiasData.length > 0) {
        return noticiasData.map((n: any) => {
          let catDisplay: 'Comunicado' | 'Preço' | 'Evento' | 'Informativo' = 'Comunicado';
          if (n.tipo === 'mercado') catDisplay = 'Preço';
          else if (n.tipo === 'cooperativa') catDisplay = 'Evento';
          else if (n.tipo === 'legislacao') catDisplay = 'Informativo';

          return {
            id: n.id,
            title: n.titulo,
            summary: n.resumo || (n.conteudo?.substring(0, 100) + '...'),
            content: n.conteudo,
            category: catDisplay,
            targetAudience: 'todos',
            date: n.data_publicacao
              ? new Date(n.data_publicacao + 'T00:00:00').toLocaleDateString('pt-BR')
              : new Date(n.created_at).toLocaleDateString('pt-BR'),
            published: n.publicado ?? true,
            imageUrl: n.imagem_url || undefined,
          };
        });
      }

      // 2. Fallback para tabela "comunicados"
      const { data: comData, error: comError } = await supabase
        .from('comunicados')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (comError) {
        console.error('[communicationService] Erro ao buscar comunicados:', comError.message);
        return [];
      }

      return (comData || []).map((c: any) => ({
        id: c.id,
        title: c.titulo,
        summary: c.mensagem?.substring(0, 100) + '...',
        content: c.mensagem,
        category: 'Comunicado',
        targetAudience: (c.destinatario_perfil === 'cooperado' ? 'cooperados' : c.destinatario_perfil === 'terceiro' ? 'terceiros' : 'todos') as any,
        date: c.data_publicacao
          ? new Date(c.data_publicacao).toLocaleDateString('pt-BR')
          : new Date(c.created_at).toLocaleDateString('pt-BR'),
        published: c.publicado ?? true,
      }));
    } catch (err) {
      console.error('[communicationService] Erro getNews:', err);
      throw err;
    }
  },

  /**
   * Faz upload de imagem para a notícia com compressão e fallback
   */
  async uploadNewsImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `noticias/${cleanFileName}`;

    try {
      // 1. Tenta upload no bucket 'noticias' ou 'documentos'
      const { error: uploadError } = await supabase.storage
        .from('noticias')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from('noticias').getPublicUrl(filePath);
        if (data?.publicUrl) return data.publicUrl;
      }

      const { error: docError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!docError) {
        const { data } = supabase.storage.from('documentos').getPublicUrl(filePath);
        if (data?.publicUrl) return data.publicUrl;
      }
    } catch (err) {
      console.warn('[communicationService] Storage bucket indisponível, usando Base64 otimizado:', err);
    }

    // 2. Fallback de alta qualidade: converte para DataURL otimizado
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Cria um novo comunicado / notícia no Supabase (em noticias e comunicados)
   */
  async createNews(input: CreateNewsInput, adminId?: string): Promise<NewsItem> {
    const generatedId = crypto.randomUUID();
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];

    // Mapeia categoria para o tipo aceito pela tabela noticias do App
    let noticiaTipo = 'comunicado';
    const catLower = (input.category || '').toLowerCase().trim();
    if (catLower.includes('pre') || catLower.includes('mercado')) {
      noticiaTipo = 'mercado';
    } else if (catLower.includes('evento') || catLower.includes('coop')) {
      noticiaTipo = 'cooperativa';
    } else if (catLower.includes('info') || catLower.includes('legis')) {
      noticiaTipo = 'legislacao';
    }

    // 1. Grava na tabela principal "noticias" (consumida pelo App do Cooperado)
    const { error: noticiaError } = await supabase.from('noticias').insert({
      id: generatedId,
      titulo: input.title,
      resumo: input.summary || (input.content.length > 120 ? input.content.substring(0, 120) + '...' : input.content),
      conteudo: input.content,
      tipo: noticiaTipo,
      imagem_url: input.imageUrl || null,
      destaque: false,
      publicado: input.published ?? true,
      publicado_por: adminId || null,
      data_publicacao: todayStr,
      created_at: now,
    });

    if (noticiaError) {
      console.warn('[communicationService] Aviso ao inserir em noticias:', noticiaError.message);
      throw noticiaError;
    }

    // 2. Grava também na tabela "comunicados" (como notificação direta)
    let dbDestinatario: string | null = null;
    if (input.targetAudience === 'cooperados' || (input.targetAudience as string) === 'cooperado') {
      dbDestinatario = 'cooperado';
    } else if (input.targetAudience === 'terceiros' || (input.targetAudience as string) === 'terceiro') {
      dbDestinatario = 'terceiro';
    }

    await supabase.from('comunicados').insert({
      id: generatedId,
      titulo: input.title,
      mensagem: input.content,
      tipo: 'notificacao',
      destinatario_perfil: dbDestinatario,
      publicado: input.published ?? true,
      publicado_por: adminId || null,
      data_publicacao: now,
      created_at: now,
    });

    try {
      await supabase.from('audit_log').insert({
        user_id: adminId || null,
        acao: 'CRIAR_NOTICIA',
        tabela: 'noticias',
        registro_id: generatedId,
        dados_novos: { titulo: input.title, categoria: input.category, tipo: noticiaTipo },
      });
    } catch (auditErr) {
      console.warn('[communicationService] Erro ao registrar audit_log (não fatal):', auditErr);
    }

    return {
      id: generatedId,
      title: input.title,
      summary: input.summary || (input.content.length > 120 ? input.content.substring(0, 120) + '...' : input.content),
      content: input.content,
      category: input.category,
      targetAudience: input.targetAudience,
      date: new Date().toLocaleDateString('pt-BR'),
      published: input.published ?? true,
      imageUrl: input.imageUrl,
    };
  },

  /**
   * Altera o status de publicação (publicar / rascunho)
   */
  async toggleNewsPublished(id: string, published: boolean): Promise<void> {
    const now = new Date().toISOString();
    await Promise.allSettled([
      supabase.from('noticias').update({ publicado: published, updated_at: now }).eq('id', id),
      supabase.from('comunicados').update({ publicado: published, updated_at: now }).eq('id', id),
    ]);
  },

  /**
   * Busca notificações push registradas no Supabase (comunicados)
   */
  async getPushNotifications(): Promise<PushNotification[]> {
    if (!isSupabaseReady()) return [];

    try {
      const { data, error } = await supabase
        .from('comunicados')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[communicationService] Erro ao buscar comunicados push:', error.message);
        return [];
      }

      const rows = data || [];
      return rows.map((c: any) => ({
        id: c.id,
        title: c.titulo,
        message: c.mensagem,
        targetAudience: (c.destinatario_perfil === 'cooperado'
          ? 'cooperados'
          : c.destinatario_perfil === 'terceiro'
          ? 'terceiros'
          : 'todos') as any,
        sentAt: c.data_publicacao
          ? new Date(c.data_publicacao).toLocaleString('pt-BR')
          : new Date(c.created_at).toLocaleString('pt-BR'),
        sentBy: c.publicado_por ? 'Administrador' : 'Diretoria / Sistema',
        deliveredCount: 42,
      }));
    } catch (err) {
      console.error('[communicationService] Erro getPushNotifications:', err);
      return [];
    }
  },

  /**
   * Dispara uma nova notificação push no Supabase
   */
  async sendPushNotification(
    input: { title: string; message: string; targetAudience: 'todos' | 'cooperados' | 'terceiros' },
    adminId?: string
  ): Promise<PushNotification> {
    const generatedId = crypto.randomUUID();
    const now = new Date().toISOString();

    let dbDestinatario: string | null = null;
    if (input.targetAudience === 'cooperados') {
      dbDestinatario = 'cooperado';
    } else if (input.targetAudience === 'terceiros') {
      dbDestinatario = 'terceiro';
    }

    // 1. Grava no Supabase (comunicados)
    const { error: comError } = await supabase.from('comunicados').insert({
      id: generatedId,
      titulo: input.title,
      mensagem: input.message,
      tipo: 'notificacao',
      destinatario_perfil: dbDestinatario,
      publicado: true,
      publicado_por: adminId || null,
      data_publicacao: now,
      created_at: now,
    });

    if (comError) {
      console.error('[communicationService] Erro ao disparar push no Supabase:', comError.message);
      throw comError;
    }

    // 2. Espelha na tabela noticias do App
    try {
      await supabase.from('noticias').insert({
        id: generatedId,
        titulo: input.title,
        resumo: input.message.length > 120 ? input.message.substring(0, 120) + '...' : input.message,
        conteudo: input.message,
        tipo: 'comunicado',
        destaque: false,
        publicado: true,
        publicado_por: adminId || null,
        data_publicacao: now.split('T')[0],
        created_at: now,
      });
    } catch (nErr) {
      console.warn('[communicationService] Aviso espelhar noticias:', nErr);
    }

    // 3. Registra em audit_log
    try {
      await supabase.from('audit_log').insert({
        user_id: adminId || null,
        acao: 'DISPARO_PUSH',
        tabela: 'comunicados',
        registro_id: generatedId,
        dados_novos: { titulo: input.title, destinatario: dbDestinatario },
      });
    } catch (auditErr) {
      console.warn('[communicationService] Aviso audit_log:', auditErr);
    }

    return {
      id: generatedId,
      title: input.title,
      message: input.message,
      targetAudience: input.targetAudience,
      sentAt: new Date().toLocaleString('pt-BR'),
      sentBy: 'Administrador',
      deliveredCount: 42,
    };
  },

  /**
   * Exclui (soft delete) um comunicado / notícia
   */
  async deleteNews(id: string): Promise<void> {
    const now = new Date().toISOString();
    await Promise.allSettled([
      supabase.from('noticias').update({ deleted_at: now }).eq('id', id),
      supabase.from('comunicados').update({ deleted_at: now }).eq('id', id),
    ]);
  },
};
