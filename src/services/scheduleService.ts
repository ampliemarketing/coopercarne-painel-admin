import { supabase, isSupabaseReady } from '../lib/supabase';
import type { SlaughterSchedule } from '../types';
import { COLD_ROOM_RATIOS, SLAUGHTER_FEES } from '../constants';

export interface CreateScheduleInput {
  userId: string;
  animalType: 'bovino' | 'suino' | 'cordeiro' | 'leitao';
  quantity: number;
  scheduledDate: string;
  slaughterDate: string;
  gtaNumber?: string;
  gtaSeries?: string;
  observacoes?: string;
}

export interface TaxaAbateItem {
  id: string;
  especie: string;
  valor_cooperado: number;
  valor_terceiro: number;
  unidade: string;
  ativo: boolean;
}

export const scheduleService = {
  /**
   * Busca as taxas de abate vigentes no Supabase
   */
  async getTaxasAbate(): Promise<TaxaAbateItem[]> {
    if (!isSupabaseReady()) return [];
    try {
      const { data, error } = await supabase
        .from('taxas_abate')
        .select('*')
        .eq('ativo', true);

      if (error) {
        console.warn('[scheduleService] Aviso ao buscar taxas_abate:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('[scheduleService] Erro taxas_abate:', err);
      return [];
    }
  },

  /**
   * Busca capacidade diária configurada para uma data específica
   */
  async getCapacidadeDiaria(dataStr: string): Promise<any[]> {
    if (!isSupabaseReady()) return [];
    try {
      const { data, error } = await supabase
        .from('capacidade_diaria_abate')
        .select('*')
        .eq('data', dataStr);

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  /**
   * Busca todos os agendamentos reais com relacionamento de profiles e estabelecimentos
   */
  async getSchedules(): Promise<SlaughterSchedule[]> {
    if (!isSupabaseReady()) return [];

    try {
      const [schedulesRes, taxas] = await Promise.all([
        supabase
          .from('agendamentos_abate')
          .select(`
            id,
            user_id,
            tipo_animal,
            quantidade,
            data_abate,
            status,
            requer_aprovacao,
            aprovado_por,
            aprovado_at,
            observacoes,
            rendimento_medio,
            romaneio_url,
            created_at,
            updated_at,
            deleted_at,
            profiles!agendamentos_abate_user_id_fkey (
              id,
              nome,
              email,
              telefone,
              perfil,
              estabelecimentos (
                id,
                razao_social,
                cnpj
              )
            )
          `)
          .is('deleted_at', null)
          .order('data_abate', { ascending: false }),
        this.getTaxasAbate(),
      ]);

      if (schedulesRes.error) {
        console.error('[scheduleService] Erro ao buscar agendamentos:', schedulesRes.error.message);
        throw schedulesRes.error;
      }

      const rows = schedulesRes.data || [];

      // Mapeamento e Adapter para o formato da UI
      return rows.map((row: any) => {
        const prof = row.profiles;
        const estab = prof?.estabelecimentos;
        const isTerceiro = prof?.perfil === 'terceiro';
        const animalType = (row.tipo_animal?.toLowerCase() || 'bovino') as 'bovino' | 'suino' | 'cordeiro' | 'leitao';
        const qty = row.quantidade || 1;

        // Calcula a taxa baseada no banco ou fallback
        let feePerHead: number = isTerceiro
          ? (SLAUGHTER_FEES.terceiro[animalType] || 115)
          : (SLAUGHTER_FEES.cooperado[animalType] || 85);

        const taxaCadastrada = taxas.find((t) => t.especie.toLowerCase() === animalType);
        if (taxaCadastrada) {
          feePerHead = isTerceiro ? taxaCadastrada.valor_terceiro : taxaCadastrada.valor_cooperado;
        }

        const ratio = COLD_ROOM_RATIOS[animalType] || 1.0;
        const coldRoomUnits = qty * ratio;

        // Extrai GTA e dados de observação
        const obs = row.observacoes || '';
        let gta = 'GTA-Pendente';
        let confirmedQty: number | undefined = undefined;
        let arrivalNotes: string | undefined = undefined;

        if (obs.includes('GTA:')) {
          const match = obs.match(/GTA:\s*([^\s|;]+)/i);
          if (match && match[1]) gta = match[1];
        }

        if (obs.includes('CONF_CURRAL:')) {
          const matchQty = obs.match(/CONF_CURRAL:\s*(\d+)/i);
          if (matchQty && matchQty[1]) confirmedQty = Number(matchQty[1]);
        }

        if (obs.includes('OBS:')) {
          const matchObs = obs.match(/OBS:\s*(.+)$/i);
          if (matchObs && matchObs[1]) arrivalNotes = matchObs[1];
        }

        const isArrivalConfirmed =
          row.status === 'recebido_curral' ||
          row.status === 'concluido' ||
          row.status === 'em_abate' ||
          obs.includes('CONF_CURRAL');

        const isNoShow = row.status === 'cancelado' || obs.includes('AUSENCIA');

        let uiStatus: SlaughterSchedule['status'] = 'aprovado';
        if (row.status === 'rejeitado') uiStatus = 'rejeitado';
        else if (row.status === 'pendente' || (isTerceiro && !row.aprovado_at && row.status !== 'aprovado' && !isArrivalConfirmed)) {
          uiStatus = 'pendente_aprovacao';
        } else if (isArrivalConfirmed) {
          uiStatus = 'concluido';
        }

        const producerName = prof?.nome || estab?.razao_social || 'Produtor Cooperado';
        const initials = producerName
          .split(' ')
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'CP';

        return {
          id: row.id,
          userId: row.user_id,
          userName: producerName,
          userType: isTerceiro ? 'terceiro' : 'cooperado',
          animalType,
          quantity: qty,
          scheduledDate: row.created_at ? row.created_at.split('T')[0] : row.data_abate,
          slaughterDate: row.data_abate,
          arrivalConfirmed: isArrivalConfirmed,
          arrivalConfirmedAt: isArrivalConfirmed ? (row.updated_at ? new Date(row.updated_at).toLocaleString('pt-BR') : undefined) : undefined,
          confirmedQuantity: confirmedQty || (isArrivalConfirmed ? qty : undefined),
          arrivalNotes,
          noShowAlert: isNoShow,
          slaughterFee: feePerHead,
          totalFee: feePerHead * qty,
          coldRoomUnits,
          brandMark: initials,
          status: uiStatus,
          gtaNumber: gta,
          gtaSeries: 'A',
          gtaApproved: true,
        };
      });
    } catch (err: any) {
      console.error('[scheduleService] Falha ao processar getSchedules:', err);
      throw err;
    }
  },

  /**
   * Cria um novo agendamento com validação de capacidade e cálculo de taxa
   */
  async createSchedule(input: CreateScheduleInput): Promise<SlaughterSchedule> {
    const generatedId = crypto.randomUUID();

    // 1. Busca perfil do produtor para saber se é cooperado ou terceiro
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nome, perfil, estabelecimentos(razao_social)')
      .eq('id', input.userId)
      .single();

    const isTerceiro = profile?.perfil === 'terceiro';
    const initialStatus = isTerceiro ? 'pendente' : 'aprovado';

    // 2. Valida capacidade da câmara fria / limite diário
    const dailyCapacities = await this.getCapacidadeDiaria(input.slaughterDate);
    const capacityRecord = dailyCapacities.find(
      (c) => c.tipo_animal.toLowerCase() === input.animalType.toLowerCase()
    );

    if (capacityRecord) {
      const currentOccupied = capacityRecord.ocupado || 0;
      const totalCap = capacityRecord.capacidade_total || 50;
      if (currentOccupied + input.quantity > totalCap) {
        throw new Error(
          `Capacidade diária excedida para ${input.animalType} na data ${input.slaughterDate} (${currentOccupied}/${totalCap} ocupadas).`
        );
      }
    }

    // 3. Monta observações com GTA
    let obsText = '';
    if (input.gtaNumber) {
      obsText += `GTA: ${input.gtaNumber} `;
    }
    if (input.observacoes) {
      obsText += `OBS: ${input.observacoes}`;
    }

    // 4. Insere no Supabase
    const { error: insertError } = await supabase.from('agendamentos_abate').insert({
      id: generatedId,
      user_id: input.userId,
      tipo_animal: input.animalType,
      quantidade: input.quantity,
      data_abate: input.slaughterDate,
      status: initialStatus,
      requer_aprovacao: isTerceiro,
      observacoes: obsText.trim() || null,
    });

    if (insertError) {
      console.error('[scheduleService] Erro ao inserir agendamento:', insertError.message);
      throw insertError;
    }

    // 5. Atualiza capacidade diária se existir registro
    if (capacityRecord) {
      await supabase
        .from('capacidade_diaria_abate')
        .update({
          ocupado: (capacityRecord.ocupado || 0) + input.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', capacityRecord.id);
    }

    // 6. Registra no audit_log
    await supabase.from('audit_log').insert({
      acao: 'CRIAR_AGENDAMENTO_ABATE',
      tabela: 'agendamentos_abate',
      registro_id: generatedId,
      dados_novos: {
        user_id: input.userId,
        tipo_animal: input.animalType,
        quantidade: input.quantity,
        data_abate: input.slaughterDate,
        status: initialStatus,
      },
    });

    const feePerHead = isTerceiro
      ? (SLAUGHTER_FEES.terceiro[input.animalType] || 115)
      : (SLAUGHTER_FEES.cooperado[input.animalType] || 85);

    const producerName = profile?.nome || (profile as any)?.estabelecimentos?.razao_social || 'Produtor';

    return {
      id: generatedId,
      userId: input.userId,
      userName: producerName,
      userType: isTerceiro ? 'terceiro' : 'cooperado',
      animalType: input.animalType,
      quantity: input.quantity,
      scheduledDate: input.scheduledDate,
      slaughterDate: input.slaughterDate,
      arrivalConfirmed: false,
      noShowAlert: false,
      slaughterFee: feePerHead,
      totalFee: feePerHead * input.quantity,
      coldRoomUnits: input.quantity * (COLD_ROOM_RATIOS[input.animalType] || 1.0),
      status: isTerceiro ? 'pendente_aprovacao' : 'aprovado',
      gtaNumber: input.gtaNumber || 'GTA-Pendente',
      gtaSeries: 'A',
      gtaApproved: true,
    };
  },

  /**
   * Atualiza status do agendamento (Aprovar / Rejeitar terceiro / Ausência)
   */
  async updateStatus(id: string, newStatus: 'aprovado' | 'rejeitado' | 'cancelado', adminId?: string): Promise<void> {
    const isAprovado = newStatus === 'aprovado';
    const updatePayload: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (isAprovado) {
      updatePayload.aprovado_at = new Date().toISOString();
      if (adminId) updatePayload.aprovado_por = adminId;
    }

    const { error } = await supabase
      .from('agendamentos_abate')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;

    await supabase.from('audit_log').insert({
      acao: `STATUS_AGENDAMENTO_${newStatus.toUpperCase()}`,
      tabela: 'agendamentos_abate',
      registro_id: id,
      dados_novos: { status: newStatus },
    });
  },

  /**
   * Confirma chegada física dos animais no curral (balança / conferência)
   */
  async confirmArrival(id: string, confirmedQty: number, notes?: string): Promise<void> {
    // Busca observação atual
    const { data: current } = await supabase
      .from('agendamentos_abate')
      .select('observacoes')
      .eq('id', id)
      .single();

    const currentObs = current?.observacoes || '';
    const updatedObs = `${currentObs} | CONF_CURRAL: ${confirmedQty} ${notes ? `| OBS: ${notes}` : ''}`.trim();

    const { error } = await supabase
      .from('agendamentos_abate')
      .update({
        status: 'recebido_curral',
        observacoes: updatedObs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('audit_log').insert({
      acao: 'CONFIRMAR_CHEGADA_CURRAL',
      tabela: 'agendamentos_abate',
      registro_id: id,
      dados_novos: {
        status: 'recebido_curral',
        confirmedQty,
        notes,
      },
    });
  },
};
