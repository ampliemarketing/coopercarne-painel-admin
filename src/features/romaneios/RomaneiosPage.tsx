import { useState, useMemo } from 'react';
import { RefreshCw, AlertCircle, FileCheck2, Paperclip, Eye } from 'lucide-react';
import { PageHeader, Badge } from '../../components/ui';
import { RomaneioDetailsModal } from '../../components/modals/RomaneioDetailsModal';
import { useSchedulesQuery } from '../../hooks/useSchedules';
import type { SlaughterSchedule } from '../../types';

export function RomaneiosPage() {
  const { data: schedules = [], isLoading, isError, error, refetch, isFetching } = useSchedulesQuery();
  const [detailsSchedule, setDetailsSchedule] = useState<SlaughterSchedule | null>(null);

  // Mock temporário de anexos (id do agendamento -> nome do arquivo).
  // Quando integrar, isso vira uma coluna real (ex: romaneio_url) em agendamentos_abate.
  const [anexos, setAnexos] = useState<Record<string, string>>({});

  const finalizados = useMemo(
    () =>
      schedules
        .filter((s) => s.statusOperacional === 'finalizado')
        .sort((a, b) => (a.slaughterDate < b.slaughterDate ? 1 : -1)),
    [schedules]
  );

  const handleAnexoEnviado = (scheduleId: string, nomeArquivo: string) => {
    setAnexos((prev) => ({ ...prev, [scheduleId]: nomeArquivo }));
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Romaneios"
          description="Agendamentos de abate finalizados, com detalhes e documento oficial anexável para o cooperado/terceiro"
        />
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors shadow-sm disabled:opacity-50 flex-shrink-0"
          title="Atualizar lista"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#c51d1f]' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar romaneios</h3>
          <p className="text-xs text-red-700 mb-4 max-w-md mx-auto">
            {error?.message || 'Ocorreu uma falha na consulta ao banco de dados.'}
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
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Cliente</th>
                  <th className="text-left px-4 py-2.5 font-medium">Espécie / Qtd</th>
                  <th className="text-left px-4 py-2.5 font-medium">Data do Abate</th>
                  <th className="text-left px-4 py-2.5 font-medium">Processado</th>
                  <th className="text-left px-4 py-2.5 font-medium">Romaneio</th>
                  <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {finalizados.map((sch) => (
                  <tr key={sch.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        {sch.userName}
                        <Badge variant={sch.userType === 'cooperado' ? 'blue' : 'purple'}>{sch.userType}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      <span className="font-semibold text-gray-700">{sch.quantity}x {sch.animalType}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {sch.slaughterDate.split('-').reverse().join('/')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-700">{sch.quantidadeProcessada ?? sch.quantity} cab.</span>
                      {!!sch.quantidadePerda && (
                        <div className="text-[11px] text-red-600">perda: {sch.quantidadePerda}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {anexos[sch.id] ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
                          <Paperclip className="w-3 h-3" /> Anexado
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sem anexo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDetailsSchedule(sch)}
                        className="text-xs font-semibold px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detalhar
                      </button>
                    </td>
                  </tr>
                ))}

                {finalizados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Nenhum agendamento finalizado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailsSchedule && (
        <RomaneioDetailsModal
          schedule={detailsSchedule}
          anexoAtual={anexos[detailsSchedule.id]}
          onClose={() => setDetailsSchedule(null)}
          onAnexoEnviado={handleAnexoEnviado}
        />
      )}
    </div>
  );
}
