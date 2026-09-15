import { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { PageHeader, SpeciesDonutCard } from '../../components/ui';
import { COLD_ROOM_CAPACITY } from '../../constants';
import { useSchedulesQuery } from '../../hooks/useSchedules';
import { coldRoomService } from '../../services/coldRoomService';

export function ColdRoomPage() {
  const { data: schedules = [], isLoading, isError, error, refetch, isFetching } = useSchedulesQuery();

  const [isWeeklyProjectionOpen, setIsWeeklyProjectionOpen] = useState(false);

  // Calcula visão consolidada com dados reais do Supabase
  const overview = coldRoomService.calculateOverview(schedules);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Câmara Fria & Ocupação"
          description="Monitoramento em tempo real do espaço disponível, capacidade por espécie e balanço de ocupação"
        />
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start md:self-auto p-2 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors shadow-sm disabled:opacity-50"
          title="Atualizar ocupação da câmara"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#c51d1f]' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-white border border-slate-200 rounded-lg" />
          <div className="h-64 bg-white border border-slate-200 rounded-lg" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar dados da câmara fria</h3>
          <p className="text-xs text-red-700 mb-4">{error?.message}</p>
        </div>
      ) : (
        <>
          {/* BANNER DE STATUS DA CÂMARA FRIA */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                  overview.isOverCapacity
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {overview.occupancyPercentage}%
              </div>
              <div className="text-xs text-slate-700 flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  {overview.isOverCapacity ? '⚠️ CAPACIDADE EXCEDIDA!' : '✅ Espaço Disponível Garantido'}
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">
                  Ocupação Real: <strong className="text-slate-900">{overview.totalOccupiedUnits} un</strong> de{' '}
                  {COLD_ROOM_CAPACITY} un.
                </span>
                <span className="text-slate-500">
                  Livre restante:{' '}
                  <strong className="text-slate-900">{overview.remainingUnits} un</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* PAINEL DE OCUPAÇÃO POR ESPÉCIE & PROJEÇÃO SEMANAL */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Capacidade & Ocupação Atual por Espécie
                </h3>
                <p className="text-[11px] text-slate-500">
                  Balanço por lotes agendados e confirmados no curral (Capacidade Máxima: {COLD_ROOM_CAPACITY} un.)
                </p>
              </div>
              <span className="text-xs font-bold text-[#c51d1f] bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                {overview.totalOccupiedUnits} / {COLD_ROOM_CAPACITY} un.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <SpeciesDonutCard
                title="BOVINO (1.0x)"
                current={overview.bySpecies.bovino.units}
                capacity={overview.bySpecies.bovino.capacity}
              />
              <SpeciesDonutCard
                title="SUÍNO (1.5x)"
                current={overview.bySpecies.suino.units}
                capacity={overview.bySpecies.suino.capacity}
              />
              <SpeciesDonutCard
                title="CORDEIRO (0.5x)"
                current={overview.bySpecies.cordeiro.units}
                capacity={overview.bySpecies.cordeiro.capacity}
              />
              <SpeciesDonutCard
                title="LEITÃO (0.3x)"
                current={overview.bySpecies.leitao.units}
                capacity={overview.bySpecies.leitao.capacity}
              />
            </div>

            {/* SEÇÃO RETRÁTIL DA PROJEÇÃO SEMANAL */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsWeeklyProjectionOpen(!isWeeklyProjectionOpen)}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded transition-colors border border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Projeção Semanal de Ocupação (Dia a Dia)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span>{isWeeklyProjectionOpen ? 'Recolher' : 'Expandir (6 Dias)'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      isWeeklyProjectionOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {isWeeklyProjectionOpen && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 animate-fadeIn">
                  <SpeciesDonutCard title="SEG (29/06)" current={42} capacity={COLD_ROOM_CAPACITY} unit="un." />
                  <SpeciesDonutCard title="TER (30/06)" current={68} capacity={COLD_ROOM_CAPACITY} unit="un." />
                  <SpeciesDonutCard title="QUA (01/07)" current={125} capacity={COLD_ROOM_CAPACITY} unit="un." />
                  <SpeciesDonutCard title="QUI (02/07)" current={94} capacity={COLD_ROOM_CAPACITY} unit="un." />
                  <SpeciesDonutCard title="SEX (03/07)" current={160} capacity={COLD_ROOM_CAPACITY} unit="un." />
                  <SpeciesDonutCard title="SÁB (04/07)" current={85} capacity={COLD_ROOM_CAPACITY} unit="un." />
                </div>
              )}
            </div>
          </div>

        </>
      )}
    </div>
  );
}
