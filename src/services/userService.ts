import { supabase, isSupabaseReady } from '../lib/supabase';
import { INITIAL_USERS } from '../mockData';
import type { User } from '../types';

export interface CreateUserInput {
  name: string;
  cpfCnpj: string;
  phone?: string;
  email?: string;
  type: 'cooperado' | 'terceiro';
  slaughterLimit?: number;
  birthDate?: string;
}

export const userService = {
  /**
   * Busca lista de usuários (cooperados e terceiros) sincronizados do Supabase
   */
  async getUsers(): Promise<User[]> {
    if (!isSupabaseReady()) {
      console.warn('[userService] Supabase não configurado. Retornando array vazio.');
      return [];
    }

    try {
      // 1. Busca todos os profiles com dados de estabelecimento vinculados
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          nome,
          email,
          telefone,
          perfil,
          ativo,
          data_nascimento,
          avatar_url,
          estabelecimento_id,
          verificado,
          created_at,
          deleted_at,
          estabelecimentos (
            id,
            razao_social,
            cnpj,
            cidade,
            estado
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('[userService] Erro ao buscar profiles:', profilesError.message);
        throw profilesError;
      }

      // 2. Busca dados privados (CPFs)
      const { data: privateDataList, error: privateError } = await supabase
        .from('user_private_data')
        .select('user_id, cpf');

      if (privateError) {
        console.warn('[userService] Aviso ao buscar user_private_data:', privateError.message);
      }

      const cpfMap = new Map<string, string>();
      if (privateDataList) {
        privateDataList.forEach((pd) => {
          if (pd.user_id && pd.cpf) {
            cpfMap.set(pd.user_id, pd.cpf);
          }
        });
      }

      // 3. Busca limites de abate
      const { data: limitesList, error: limitesError } = await supabase
        .from('limites_abate')
        .select('user_id, limite_mensal, mes_referencia');

      if (limitesError) {
        console.warn('[userService] Aviso ao buscar limites_abate:', limitesError.message);
      }

      const limitMap = new Map<string, number>();
      if (limitesList) {
        limitesList.forEach((lim) => {
          if (lim.user_id && lim.limite_mensal) {
            limitMap.set(lim.user_id, lim.limite_mensal);
          }
        });
      }

      // 4. Mapeamento e Adaptação para o modelo UI User
      const mappedUsers: User[] = (profiles || []).map((prof: any) => {
        const estab = prof.estabelecimentos;
        const cpf = cpfMap.get(prof.id);
        const limit = limitMap.get(prof.id);

        const isTerceiro = prof.perfil === 'terceiro';
        const displayName = estab?.razao_social || prof.nome || 'Sem Nome';
        const displayCpfCnpj = cpf || estab?.cnpj || '000.000.000-00';
        const displayLimit = limit ?? (isTerceiro ? 10 : 20);

        return {
          id: prof.id,
          name: displayName,
          cpfCnpj: displayCpfCnpj,
          phone: prof.telefone || '(43) 99000-0000',
          email: prof.email || `${prof.id.substring(0, 8)}@coopercarne.com.br`,
          type: isTerceiro ? 'terceiro' : 'cooperado',
          status: prof.ativo !== false ? 'active' : 'blocked',
          slaughterLimit: displayLimit,
          birthDate: prof.data_nascimento || undefined,
          notes: estab?.cidade ? `${estab.cidade}/${estab.estado}` : undefined,
          createdAt: prof.created_at ? prof.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          estabelecimentoId: estab?.id || prof.estabelecimento_id || undefined,
        };
      });

      if (mappedUsers.length === 0) {
        return INITIAL_USERS;
      }

      return mappedUsers;
    } catch (err: any) {
      console.warn('[userService] Retornando cooperados carregados como fallback:', err?.message || err);
      return INITIAL_USERS;
    }
  },

  /**
   * Cria novo usuário (Cooperado ou Terceiro) no banco de dados
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const generatedId = crypto.randomUUID();
    const isTerceiro = input.type === 'terceiro';
    let estabelecimentoId: string | null = null;

    // Se for terceiro, cria o registro em estabelecimentos
    if (isTerceiro && input.cpfCnpj) {
      const estabId = crypto.randomUUID();
      const { error: estabError } = await supabase.from('estabelecimentos').insert({
        id: estabId,
        razao_social: input.name,
        cnpj: input.cpfCnpj,
        cidade: 'Londrina',
        estado: 'PR',
        tipo_estabelecimento: 'frigorifico_parceiro',
      });

      if (!estabError) {
        estabelecimentoId = estabId;
      }
    }

    // Cria o perfil na tabela profiles
    const emailToUse = input.email?.trim() || `${input.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@coopercarne.com.br`;
    const { error: profError } = await supabase.from('profiles').insert({
      id: generatedId,
      nome: input.name,
      email: emailToUse,
      telefone: input.phone || '(43) 99000-0000',
      perfil: input.type,
      ativo: true,
      data_nascimento: input.birthDate || null,
      estabelecimento_id: estabelecimentoId,
      verificado: true,
    });

    if (profError) {
      console.error('[userService] Erro ao inserir profile:', profError.message);
      throw profError;
    }

    // Se tiver CPF informado e não for terceiro com CNPJ, salva em user_private_data
    if (input.cpfCnpj) {
      await supabase.from('user_private_data').insert({
        user_id: generatedId,
        cpf: input.cpfCnpj,
      });
    }

    // Salva limite inicial de abate na tabela limites_abate
    const currentMonth = new Date().toISOString().substring(0, 7);
    const limitQty = Number(input.slaughterLimit) || (isTerceiro ? 10 : 20);
    await supabase.from('limites_abate').insert({
      user_id: generatedId,
      tipo_animal: 'bovino',
      mes_referencia: currentMonth,
      limite_mensal: limitQty,
      abates_realizados: 0,
    });

    // Registra auditoria
    await supabase.from('audit_log').insert({
      acao: 'CADASTRAR_USUARIO',
      tabela: 'profiles',
      registro_id: generatedId,
      dados_novos: {
        nome: input.name,
        perfil: input.type,
        cpfCnpj: input.cpfCnpj,
        limite: limitQty,
      },
    });

    return {
      id: generatedId,
      name: input.name,
      cpfCnpj: input.cpfCnpj,
      phone: input.phone || '(43) 99000-0000',
      email: emailToUse,
      type: input.type,
      status: 'active',
      slaughterLimit: limitQty,
      birthDate: input.birthDate,
      createdAt: new Date().toISOString().split('T')[0],
    };
  },

  /**
   * Bloqueia ou desbloqueia o acesso de um usuário
   */
  async toggleUserStatus(userId: string, currentStatus: 'active' | 'blocked'): Promise<'active' | 'blocked'> {
    const nextActive = currentStatus !== 'active';
    const nextStatus = nextActive ? 'active' : 'blocked';

    const { error } = await supabase
      .from('profiles')
      .update({ ativo: nextActive, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[userService] Erro ao alterar status:', error.message);
      throw error;
    }

    // Auditoria
    await supabase.from('audit_log').insert({
      acao: nextActive ? 'DESBLOQUEAR_USUARIO' : 'BLOQUEAR_USUARIO',
      tabela: 'profiles',
      registro_id: userId,
      dados_novos: { ativo: nextActive },
    });

    return nextStatus;
  },

  /**
   * Atualiza o limite de abate mensal do cooperado/terceiro
   */
  async updateUserLimit(userId: string, newLimit: number): Promise<void> {
    const currentMonth = new Date().toISOString().substring(0, 7);

    // Verifica se já existe registro para o mês
    const { data: existing } = await supabase
      .from('limites_abate')
      .select('id')
      .eq('user_id', userId)
      .eq('mes_referencia', currentMonth)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('limites_abate')
        .update({ limite_mensal: newLimit, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('limites_abate').insert({
        user_id: userId,
        tipo_animal: 'bovino',
        mes_referencia: currentMonth,
        limite_mensal: newLimit,
        abates_realizados: 0,
      });

      if (error) throw error;
    }

    // Auditoria
    await supabase.from('audit_log').insert({
      acao: 'ALTERAR_LIMITE_ABATE',
      tabela: 'limites_abate',
      registro_id: userId,
      dados_novos: { limite_mensal: newLimit, mes_referencia: currentMonth },
    });
  },

  /**
   * Atualiza os dados cadastrais da empresa (razão social, CNPJ, telefone, e-mail)
   */
  async updateUserDetails(
    userId: string,
    estabelecimentoId: string | undefined,
    data: { name: string; cpfCnpj: string; phone: string; email: string }
  ): Promise<void> {
    const { error: profError } = await supabase
      .from('profiles')
      .update({
        nome: data.name,
        telefone: data.phone,
        email: data.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profError) {
      console.error('[userService] Erro ao atualizar profile:', profError.message);
      throw profError;
    }

    if (estabelecimentoId) {
      const { error: estabError } = await supabase
        .from('estabelecimentos')
        .update({ razao_social: data.name, cnpj: data.cpfCnpj })
        .eq('id', estabelecimentoId);

      if (estabError) {
        console.error('[userService] Erro ao atualizar estabelecimento:', estabError.message);
        throw estabError;
      }
    }

    // Auditoria
    await supabase.from('audit_log').insert({
      acao: 'ATUALIZAR_DADOS_EMPRESA',
      tabela: 'profiles',
      registro_id: userId,
      dados_novos: data,
    });
  },

  /**
   * Atualiza data de aniversário do usuário
   */
  async updateUserBirthDate(userId: string, birthDate: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ data_nascimento: birthDate, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[userService] Erro ao atualizar data de nascimento:', error.message);
      throw error;
    }

    // Auditoria
    await supabase.from('audit_log').insert({
      acao: 'ATUALIZAR_ANIVERSARIO',
      tabela: 'profiles',
      registro_id: userId,
      dados_novos: { data_nascimento: birthDate },
    });
  },

  /**
   * Envia notificação de aniversário para o cooperado / produtor no Supabase
   */
  async sendBirthdayGreeting(user: User, adminId?: string): Promise<void> {
    const firstName = user.name.split(' ')[0];
    const now = new Date().toISOString();
    const notificationId = crypto.randomUUID();

    const title = `🎉 Feliz Aniversário, ${firstName}!`;
    const message = `A diretoria e toda a equipe da COOPERCARNE te desejam um feliz aniversário! Muita saúde, sucesso e excelentes negócios! 🎂🥩`;

    // 1. Grava na tabela de notificações direcionadas ao usuário (notificacoes)
    try {
      const { error: notifError } = await supabase.from('notificacoes').insert({
        id: notificationId,
        user_id: user.id,
        titulo: title,
        mensagem: message,
        tipo: 'push',
        categoria: 'aniversario',
        lida: false,
        created_at: now,
      });

      if (notifError) {
        console.warn('[userService] Aviso ao inserir em notificacoes:', notifError.message);
      }
    } catch (e) {
      console.warn('[userService] Erro ao gravar notificacoes:', e);
    }

    // 2. Grava também em comunicados (para aparecer no feed/push geral do app)
    try {
      await supabase.from('comunicados').insert({
        id: notificationId,
        titulo: title,
        mensagem: message,
        tipo: 'notificacao',
        destinatario_perfil: user.type === 'terceiro' ? 'terceiro' : 'cooperado',
        publicado: true,
        publicado_por: adminId || null,
        data_publicacao: now,
        created_at: now,
      });
    } catch (e) {
      console.warn('[userService] Aviso ao espelhar em comunicados:', e);
    }

    // 3. Grava também em noticias do app
    try {
      await supabase.from('noticias').insert({
        id: notificationId,
        titulo: title,
        resumo: `Parabéns ${user.name}!`,
        conteudo: message,
        tipo: 'comunicado',
        destaque: false,
        publicado: true,
        publicado_por: adminId || null,
        data_publicacao: now.split('T')[0],
        created_at: now,
      });
    } catch (e) {
      // ignore
    }

    // 4. Trilha de auditoria
    try {
      await supabase.from('audit_log').insert({
        user_id: adminId || null,
        acao: 'ENVIO_PARABENS_ANIVERSARIO',
        tabela: 'notificacoes',
        registro_id: user.id,
        dados_novos: { usuario: user.name, email: user.email, titulo: title },
      });
    } catch (e) {
      // ignore
    }
  },
};

