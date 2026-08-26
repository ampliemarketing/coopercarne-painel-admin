import { useState, useMemo } from 'react';
import {
  RefreshCw,
  AlertCircle,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { PageHeader, Badge } from '../../components/ui';
import { ReceberAbateModal } from '../../components/modals/ReceberAbateModal';
import { FinalizarAbateModal } from '../../components/modals/FinalizarAbateModal';
import { useSchedulesQuery, useConfirmarPresencaMutation } from '../../hooks/useSchedules';
import type { SlaughterSchedule } from '../../types';

type StatusFilter = 'todos' | 'reservado' | 'confirmado' | 'nao_confirmado' | 'em_processo' | 'finalizado';

const STATUS_CONFIG: Record<
  Exclude<StatusFilter, 'todos'>,
  { label: string; variant: 'blue' | 'green' | 'red' | 'amber' | 'gray' }
> = {
  reservado: { label: 'Reservado', variant: 'blue' },
  confirmado: { label: 'Confirmado', variant: 'green' },
  nao_confirmado: { label: 'Não Confirmado', variant: 'red' },
  em_processo: { label: 'Em Processo', variant: 'amber' },
  finalizado: { label: 'Finalizado', variant: 'gray' },
};

export function AbatesPage() {
  const { data: schedules = [], isLoading, isError, error, refetch, isFetching } = useSchedulesQuery();
  const confirmarPresencaMutation = useConfirmarPresencaMutation();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [receberSchedule, setReceberSchedule] = useState<SlaughterSchedule | null>(null);
  const [finalizarSchedule, setFinalizarSchedule] = useState<SlaughterSchedule | null>(null);

  const withStatus = useMemo(
    () => schedules.map((s) => ({ ...s, statusOperacional: s.statusOperacional || 'reservado' })),
    [schedules]
  );

  const filteredSchedules = useMemo(() => {
    const sorted = [...withStatus].sort((a, b) => (a.slaughterDate < b.slaughterDate ? 1 : -1));
    if (statusFilter === 'todos') return sorted;
    return sorted.filter((s) => s.statusOperacional === statusFilter);
  }, [withStatus, statusFilter]);

  const countByStatus = (status: StatusFilter) =>
    status === 'todos' ? withStatus.length : withStatus.filter((s) => s.statusOperacional === status).length;

  const handleConfirmarManualmente = (schedule: SlaughterSchedule, confirmado: boolean) => {
    if (!confirmado && !confirm(`Marcar "${schedule.userName}" como NÃO CONFIRMADO? A vaga na agenda será liberada.`)) {
      return;
    }
    confirmarPresencaMutation.mutate({
      scheduleId: schedule.id,
      confirmado,
      quantidadeConfirmada: schedule.quantity,
      userName: schedule.userName,
    });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Abates"
          description="Acompanhamento operacional de todos os agendamentos: reserva, confirmação, recebimento e finalização"
        />
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors shadow-sm disabled:opacity-50 flex-shrink-0"
          title="Atualizar lista do Supabase"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#c51d1f]' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar abates</h3>
          <p className="text-xs text-red-700 mb-4 max-w-md mx-auto">
            {error?.message || 'Ocorreu uma falha na consulta ao banco de dados do Supabase.'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
            {(['todos', 'reservado', 'confirmado', 'nao_confirmado', 'em_processo', 'finalizado'] as StatusFilter[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-colors ${
                    statusFilter === status
                      ? 'bg-[#c51d1f] text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {status === 'todos' ? 'Todos' : STATUS_CONFIG[status].label} ({countByStatus(status)})
                </button>
              )
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Cliente</th>
                  <th className="text-left px-4 py-2.5 font-medium">Espécie / Qtd</th>
                  <th className="text-left px-4 py-2.5 font-medium">Data do Abate</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredSchedules.map((sch) => {
                  const cfg = STATUS_CONFIG[sch.statusOperacional as Exclude<StatusFilter, 'todos'>];
                  return (
                    <tr key={sch.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {sch.userName}
                          <Badge variant={sch.userType === 'cooperado' ? 'blue' : 'purple'}>{sch.userType}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        <span className="font-semibold text-gray-700">{sch.quantity}x {sch.animalType}</span>
                        {sch.machos !== undefined && sch.femeas !== undefined && (
                          <div className="text-[11px] text-gray-500 normal-case">{sch.machos} machos · {sch.femeas} fêmeas</div>
                        )}
                        {sch.statusOperacional === 'confirmado' && sch.quantidadeConfirmada !== undefined && (
                          <div className="text-[11px] text-emerald-600 normal-case">Confirmado: {sch.quantidadeConfirmada} cab.</div>
                        )}
                        {(sch.statusOperacional === 'em_processo' || sch.statusOperacional === 'finalizado') &&
                          sch.quantidadeRecebida !== undefined && (
                            <div className="text-[11px] text-blue-600 normal-case">Recebido: {sch.quantidadeRecebida} cab.</div>
                          )}
                        {sch.statusOperacional === 'finalizado' && sch.quantidadeProcessada !== undefined && (
                          <div className="text-[11px] text-gray-500 normal-case">
                            Processado: {sch.quantidadeProcessada} cab.
                            {sch.quantidadePerda ? ` (perda: ${sch.quantidadePerda})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {sch.slaughterDate.split('-').reverse().join('/')}
                      </td>
                      <td className="px-4 py-3">
                        {cfg && <Badge variant={cfg.variant}>{cfg.label}</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {sch.statusOperacional === 'reservado' && (
                            <>
                              <button
                                onClick={() => handleConfirmarManualmente(sch, true)}
                                disabled={confirmarPresencaMutation.isPending}
                                className="text-xs font-semibold px-2.5 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                                title="Confirmar manualmente (ex: cooperado ligou por telefone)"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
                              </button>
                              <button
                                onClick={() => handleConfirmarManualmente(sch, false)}
                                disabled={confirmarPresencaMutation.isPending}
                                className="text-xs font-semibold px-2.5 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Não Confirmar
                              </button>
                            </>
                          )}
                          {sch.statusOperacional === 'confirmado' && (
                            <button
                              onClick={() => setReceberSchedule(sch)}
                              className="text-xs font-semibold px-2.5 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" /> Recebido
                            </button>
                          )}
                          {sch.statusOperacional === 'em_processo' && (
                            <button
                              onClick={() => setFinalizarSchedule(sch)}
                              className="text-xs font-semibold px-2.5 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Finalizar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredSchedules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                      <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Nenhum agendamento encontrado nesse status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {receberSchedule && (
        <ReceberAbateModal schedule={receberSchedule} onClose={() => setReceberSchedule(null)} />
      )}
      {finalizarSchedule && (
        <FinalizarAbateModal schedule={finalizarSchedule} onClose={() => setFinalizarSchedule(null)} />
      )}
    </div>
  );
}
