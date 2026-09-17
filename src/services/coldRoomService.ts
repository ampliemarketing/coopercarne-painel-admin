import { supabase, isSupabaseReady } from '../lib/supabase';
import type { ColdRoomAnimalType, ColdRoomPartType, SlaughterSchedule } from '../types';
import { CARCASS_PARTS_PER_HEAD, COLD_ROOM_MAX_DIAS_VALIDADE, COLD_ROOM_PART_CAPACITY } from '../constants';

export interface ColdRoomPartStat {
  label: string;
  occupied: number;
  capacity: number;
  percentage: number;
  isOverCapacity: boolean;
  unit: 'peças' | 'cab.';
}

export interface ColdRoomCompanyStock {
  userId: string;
  userName: string;
  totalParts: number;
  bovino: { dianteiro: number; traseiro: number };
  suino: { dianteiro: number; traseiro: number };
  cordeiro: { dianteiro: number; traseiro: number };
  leitao: number;
}

export interface ColdRoomOverview {
  totalCapacity: number;
  totalOccupied: number;
  remainingUnits: number;
  occupancyPercentage: number;
  isOverCapacity: boolean;
  overCapacityLabels: string[];
  bovino: { dianteiro: ColdRoomPartStat; traseiro: ColdRoomPartStat; headsFinalized: number };
  suino: { dianteiro: ColdRoomPartStat; traseiro: ColdRoomPartStat; headsFinalized: number };
  cordeiro: { dianteiro: ColdRoomPartStat; traseiro: ColdRoomPartStat; headsFinalized: number };
  leitao: { unidade: ColdRoomPartStat; headsFinalized: number };
}

/** Uma movimentação de saída de estoque da câmara fria, sempre associada a um lote (agendamento). */
export interface CamaraFriaMovimento {
  id: string;
  agendamentoId: string;
  pedidoId?: string;
  pedidoItemId?: string;
  tipoAnimal: ColdRoomAnimalType;
  tipoPeca: ColdRoomPartType;
  quantidade: number;
  createdAt: string;
}

/** Um lote de estoque = um agendamento de abate finalizado, com validade de 6 dias. */
export interface ColdRoomLote {
  id: string;
  userId: string;
  userName: string;
  animalType: ColdRoomAnimalType;
  finalizadoEm: string;
  expiraEm: string;
  diasRestantes: number;
  isVencido: boolean;
  isProximoVencimento: boolean;
  saldoDianteiro: number;
  saldoTraseiro: number;
  saldoUnidade: number;
  saldoTotal: number;
}

function buildPartStat(
  label: string,
  occupied: number,
  capacity: number,
  unit: ColdRoomPartStat['unit'] = 'peças'
): ColdRoomPartStat {
  return {
    label,
    occupied,
    capacity,
    unit,
    percentage: capacity > 0 ? Number(((occupied / capacity) * 100).toFixed(1)) : 0,
    isOverCapacity: occupied > capacity,
  };
}

/** Total de peças geradas por um lote ao ser finalizado, por tipo de peça (antes de qualquer consumo). */
function geradoPorLote(animalType: ColdRoomAnimalType, qty: number): { dianteiro: number; traseiro: number; unidade: number } {
  if (animalType === 'leitao') return { dianteiro: 0, traseiro: 0, unidade: qty };
  const ratios = CARCASS_PARTS_PER_HEAD[animalType];
  return { dianteiro: qty * ratios.dianteiro, traseiro: qty * ratios.traseiro, unidade: 0 };
}

/** Soma, por lote+peça, tudo que já foi consumido (pode vir de várias entregas ao longo do tempo). */
function buildConsumidoMap(movimentos: CamaraFriaMovimento[]): Map<string, number> {
  const map = new Map<string, number>();
  movimentos.forEach((m) => {
    const key = `${m.agendamentoId}|${m.tipoPeca}`;
    map.set(key, (map.get(key) || 0) + m.quantidade);
  });
  return map;
}

/**
 * Saldo atual de um lote = peças geradas no abate − soma de tudo que já foi consumido
 * dele (via camara_fria_movimentos). Nunca é um flag binário: um lote pode ser
 * consumido parcialmente várias vezes até o saldo zerar.
 */
function loteSaldo(schedule: SlaughterSchedule, consumidoMap: Map<string, number>) {
  const qty = schedule.quantidadeProcessada ?? schedule.quantity;
  if (!qty || qty <= 0) return null;

  const gerado = geradoPorLote(schedule.animalType, qty);
  const consumidoDianteiro = consumidoMap.get(`${schedule.id}|dianteiro`) || 0;
  const consumidoTraseiro = consumidoMap.get(`${schedule.id}|traseiro`) || 0;
  const consumidoUnidade = consumidoMap.get(`${schedule.id}|unidade`) || 0;

  return {
    qty,
    saldoDianteiro: Math.max(0, gerado.dianteiro - consumidoDianteiro),
    saldoTraseiro: Math.max(0, gerado.traseiro - consumidoTraseiro),
    saldoUnidade: Math.max(0, gerado.unidade - consumidoUnidade),
  };
}

export const coldRoomService = {
  /**
   * Calcula o estoque atual da câmara fria em peças de carcaça (dianteiro/traseiro),
   * a partir dos abates finalizados, descontando tudo que já foi consumido em
   * entregas (camara_fria_movimentos).
   *
   * Regras:
   * - Só entra em estoque quando o abate é finalizado (statusOperacional === 'finalizado'),
   *   pois é somente após o abate que as peças existem fisicamente na câmara.
   * - Cada entrega desconta peças de um lote específico (não um total agregado), o que
   *   permite baixas parciais e sucessivas do mesmo lote.
   * - Bovino: 1 cabeça processada = 2 dianteiros + 2 traseiros.
   * - Suíno e Cordeiro: 1 cabeça processada = 1 dianteiro + 1 traseiro.
   * - Leitão: continua controlado por cabeça (não é dividido em partes).
   */
  calculateOverview(schedules: SlaughterSchedule[], movimentos: CamaraFriaMovimento[] = []): ColdRoomOverview {
    const consumidoMap = buildConsumidoMap(movimentos);
    const totals = { bovinoD: 0, bovinoT: 0, suinoD: 0, suinoT: 0, cordeiroD: 0, cordeiroT: 0, leitao: 0 };
    const heads = { bovino: 0, suino: 0, cordeiro: 0, leitao: 0 };

    schedules.forEach((s) => {
      if (s.statusOperacional !== 'finalizado') return;
      const saldo = loteSaldo(s, consumidoMap);
      if (!saldo) return;
      if (saldo.saldoDianteiro <= 0 && saldo.saldoTraseiro <= 0 && saldo.saldoUnidade <= 0) return;

      if (s.animalType === 'bovino') {
        totals.bovinoD += saldo.saldoDianteiro;
        totals.bovinoT += saldo.saldoTraseiro;
        heads.bovino += saldo.qty;
      } else if (s.animalType === 'suino') {
        totals.suinoD += saldo.saldoDianteiro;
        totals.suinoT += saldo.saldoTraseiro;
        heads.suino += saldo.qty;
      } else if (s.animalType === 'cordeiro') {
        totals.cordeiroD += saldo.saldoDianteiro;
        totals.cordeiroT += saldo.saldoTraseiro;
        heads.cordeiro += saldo.qty;
      } else if (s.animalType === 'leitao') {
        totals.leitao += saldo.saldoUnidade;
        heads.leitao += saldo.qty;
      }
    });

    const bovino = {
      dianteiro: buildPartStat('Bovino Dianteiro', totals.bovinoD, COLD_ROOM_PART_CAPACITY.bovinoDianteiro),
      traseiro: buildPartStat('Bovino Traseiro', totals.bovinoT, COLD_ROOM_PART_CAPACITY.bovinoTraseiro),
      headsFinalized: heads.bovino,
    };
    const suino = {
      dianteiro: buildPartStat('Suíno Dianteiro', totals.suinoD, COLD_ROOM_PART_CAPACITY.suinoDianteiro),
      traseiro: buildPartStat('Suíno Traseiro', totals.suinoT, COLD_ROOM_PART_CAPACITY.suinoTraseiro),
      headsFinalized: heads.suino,
    };
    const cordeiro = {
      dianteiro: buildPartStat('Cordeiro Dianteiro', totals.cordeiroD, COLD_ROOM_PART_CAPACITY.cordeiroDianteiro),
      traseiro: buildPartStat('Cordeiro Traseiro', totals.cordeiroT, COLD_ROOM_PART_CAPACITY.cordeiroTraseiro),
      headsFinalized: heads.cordeiro,
    };
    const leitao = {
      unidade: buildPartStat('Leitão', totals.leitao, COLD_ROOM_PART_CAPACITY.leitao, 'cab.'),
      headsFinalized: heads.leitao,
    };

    const allParts = [
      bovino.dianteiro,
      bovino.traseiro,
      suino.dianteiro,
      suino.traseiro,
      cordeiro.dianteiro,
      cordeiro.traseiro,
      leitao.unidade,
    ];

    const totalCapacity = allParts.reduce((acc, p) => acc + p.capacity, 0);
    const totalOccupied = allParts.reduce((acc, p) => acc + p.occupied, 0);
    const remainingUnits = Math.max(0, totalCapacity - totalOccupied);
    const occupancyPercentage = totalCapacity > 0 ? Number(((totalOccupied / totalCapacity) * 100).toFixed(1)) : 0;
    const overCapacityLabels = allParts.filter((p) => p.isOverCapacity).map((p) => p.label);

    return {
      totalCapacity,
      totalOccupied,
      remainingUnits,
      occupancyPercentage,
      isOverCapacity: overCapacityLabels.length > 0,
      overCapacityLabels,
      bovino,
      suino,
      cordeiro,
      leitao,
    };
  },

  /**
   * Agrupa o saldo atual da câmara fria (mesmo critério de calculateOverview) por
   * empresa/produtor, para permitir pesquisa e visualização do total por cliente.
   */
  calculateStockByCompany(schedules: SlaughterSchedule[], movimentos: CamaraFriaMovimento[] = []): ColdRoomCompanyStock[] {
    const consumidoMap = buildConsumidoMap(movimentos);
    const byCompany = new Map<string, ColdRoomCompanyStock>();

    schedules.forEach((s) => {
      if (s.statusOperacional !== 'finalizado') return;
      const saldo = loteSaldo(s, consumidoMap);
      if (!saldo) return;
      if (saldo.saldoDianteiro <= 0 && saldo.saldoTraseiro <= 0 && saldo.saldoUnidade <= 0) return;

      if (!byCompany.has(s.userId)) {
        byCompany.set(s.userId, {
          userId: s.userId,
          userName: s.userName,
          totalParts: 0,
          bovino: { dianteiro: 0, traseiro: 0 },
          suino: { dianteiro: 0, traseiro: 0 },
          cordeiro: { dianteiro: 0, traseiro: 0 },
          leitao: 0,
        });
      }
      const entry = byCompany.get(s.userId)!;

      if (s.animalType === 'bovino') {
        entry.bovino.dianteiro += saldo.saldoDianteiro;
        entry.bovino.traseiro += saldo.saldoTraseiro;
        entry.totalParts += saldo.saldoDianteiro + saldo.saldoTraseiro;
      } else if (s.animalType === 'suino') {
        entry.suino.dianteiro += saldo.saldoDianteiro;
        entry.suino.traseiro += saldo.saldoTraseiro;
        entry.totalParts += saldo.saldoDianteiro + saldo.saldoTraseiro;
      } else if (s.animalType === 'cordeiro') {
        entry.cordeiro.dianteiro += saldo.saldoDianteiro;
        entry.cordeiro.traseiro += saldo.saldoTraseiro;
        entry.totalParts += saldo.saldoDianteiro + saldo.saldoTraseiro;
      } else if (s.animalType === 'leitao') {
        entry.leitao += saldo.saldoUnidade;
        entry.totalParts += saldo.saldoUnidade;
      }
    });

    return Array.from(byCompany.values()).sort((a, b) => b.totalParts - a.totalParts);
  },

  /**
   * Lista os lotes com saldo em estoque, com validade (6 dias corridos a partir da
   * finalização do abate) e dias restantes, ordenados do mais próximo do vencimento
   * para o mais distante (ordem de consumo FEFO).
   */
  buildLotes(schedules: SlaughterSchedule[], movimentos: CamaraFriaMovimento[] = []): ColdRoomLote[] {
    const consumidoMap = buildConsumidoMap(movimentos);
    const now = Date.now();
    const lotes: ColdRoomLote[] = [];

    schedules.forEach((s) => {
      if (s.statusOperacional !== 'finalizado' || !s.finalizadoEm) return;
      const saldo = loteSaldo(s, consumidoMap);
      if (!saldo) return;

      const saldoTotal = saldo.saldoDianteiro + saldo.saldoTraseiro + saldo.saldoUnidade;
      if (saldoTotal <= 0) return;

      const finalizadoDate = new Date(s.finalizadoEm);
      const expiraDate = new Date(finalizadoDate.getTime() + COLD_ROOM_MAX_DIAS_VALIDADE * 24 * 60 * 60 * 1000);
      const diasRestantes = Math.ceil((expiraDate.getTime() - now) / (24 * 60 * 60 * 1000));

      lotes.push({
        id: s.id,
        userId: s.userId,
        userName: s.userName,
        animalType: s.animalType,
        finalizadoEm: s.finalizadoEm,
        expiraEm: expiraDate.toISOString(),
        diasRestantes,
        isVencido: diasRestantes < 0,
        isProximoVencimento: diasRestantes >= 0 && diasRestantes <= 2,
        saldoDianteiro: saldo.saldoDianteiro,
        saldoTraseiro: saldo.saldoTraseiro,
        saldoUnidade: saldo.saldoUnidade,
        saldoTotal,
      });
    });

    return lotes.sort((a, b) => a.diasRestantes - b.diasRestantes);
  },

  /** Busca todas as movimentações de saída registradas para os lotes da câmara fria. */
  async getMovimentos(): Promise<CamaraFriaMovimento[]> {
    if (!isSupabaseReady()) return [];
    try {
      const { data, error } = await supabase.from('camara_fria_movimentos').select('*');
      if (error) {
        console.warn('[coldRoomService] Aviso ao buscar movimentos da câmara fria:', error.message);
        return [];
      }
      return (data || []).map((row: any) => ({
        id: row.id,
        agendamentoId: row.agendamento_id,
        pedidoId: row.pedido_id || undefined,
        pedidoItemId: row.pedido_item_id || undefined,
        tipoAnimal: row.tipo_animal,
        tipoPeca: row.tipo_peca,
        quantidade: row.quantidade,
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.error('[coldRoomService] Erro ao buscar movimentos da câmara fria:', err);
      return [];
    }
  },

  /**
   * Dá baixa FEFO (First-Expired-First-Out) no estoque da câmara fria: busca os lotes
   * finalizados do produtor para a espécie pedida, ordenados do mais antigo (mais
   * próximo do vencimento) para o mais novo, e desconta a quantidade solicitada
   * lote a lote — podendo consumir de vários lotes numa única chamada, e respeitando
   * o que cada lote já teve consumido anteriormente (consumo parcial acumulado).
   */
  async consumirEstoqueFEFO(params: {
    userId: string;
    animalType: ColdRoomAnimalType;
    partType: ColdRoomPartType;
    quantidade: number;
    pedidoId?: string;
    pedidoItemId?: string;
    criadoPor?: string;
  }): Promise<{ consumido: number; faltante: number }> {
    if (!isSupabaseReady() || params.quantidade <= 0) {
      return { consumido: 0, faltante: params.quantidade };
    }

    const { data: lotes, error } = await supabase
      .from('agendamentos_abate')
      .select('id, quantidade, quantidade_processada, finalizado_em')
      .eq('user_id', params.userId)
      .eq('tipo_animal', params.animalType)
      .eq('status_operacional', 'finalizado')
      .is('deleted_at', null)
      .order('finalizado_em', { ascending: true });

    if (error) throw error;
    if (!lotes || lotes.length === 0) return { consumido: 0, faltante: params.quantidade };

    const loteIds = lotes.map((l: any) => l.id);
    const { data: movimentosExistentes, error: movError } = await supabase
      .from('camara_fria_movimentos')
      .select('agendamento_id, quantidade')
      .in('agendamento_id', loteIds)
      .eq('tipo_peca', params.partType);

    if (movError) throw movError;

    const consumidoPorLote = new Map<string, number>();
    (movimentosExistentes || []).forEach((m: any) => {
      consumidoPorLote.set(m.agendamento_id, (consumidoPorLote.get(m.agendamento_id) || 0) + m.quantidade);
    });

    let restante = params.quantidade;
    const novosMovimentos: { agendamento_id: string; quantidade: number }[] = [];

    for (const lote of lotes as any[]) {
      if (restante <= 0) break;

      const qtdCabecas = lote.quantidade_processada ?? lote.quantidade;
      const gerado = geradoPorLote(params.animalType, qtdCabecas);
      const totalGerado =
        params.partType === 'unidade' ? gerado.unidade : params.partType === 'dianteiro' ? gerado.dianteiro : gerado.traseiro;
      const saldo = totalGerado - (consumidoPorLote.get(lote.id) || 0);
      if (saldo <= 0) continue;

      const consumirDesteLote = Math.min(saldo, restante);
      novosMovimentos.push({ agendamento_id: lote.id, quantidade: consumirDesteLote });
      restante -= consumirDesteLote;
    }

    if (novosMovimentos.length > 0) {
      const { error: insertError } = await supabase.from('camara_fria_movimentos').insert(
        novosMovimentos.map((m) => ({
          agendamento_id: m.agendamento_id,
          pedido_id: params.pedidoId || null,
          pedido_item_id: params.pedidoItemId || null,
          tipo_animal: params.animalType,
          tipo_peca: params.partType,
          quantidade: m.quantidade,
          criado_por: params.criadoPor || null,
        }))
      );
      if (insertError) throw insertError;
    }

    return { consumido: params.quantidade - restante, faltante: restante };
  },
};
