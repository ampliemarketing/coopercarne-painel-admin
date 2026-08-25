import { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Calculator,
  Beef,
  PiggyBank,
  Boxes,
  Zap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { PageHeader, SpeciesDonutCard } from '../../components/ui';
import { COLD_ROOM_CAPACITY, COLD_ROOM_RATIOS } from '../../constants';
import { useSchedulesQuery } from '../../hooks/useSchedules';
import { coldRoomService } from '../../services/coldRoomService';

export function ColdRoomPage() {
  const { data: schedules = [], isLoading, isError, error, refetch, isFetching } = useSchedulesQuery();

  const [isWeeklyProjectionOpen, setIsWeeklyProjectionOpen] = useState(false);
  const [simCounts, setSimCounts] = useState({ bovino: 20, suino: 10, cordeiro: 15, leitao: 10 });

  const handleSimCountChange = (changedType: keyof typeof simCounts, val: number) => {
    const newQty = Math.max(0, val);
    setSimCounts({ ...simCounts, [changedType]: newQty });
  };

  // Calcula visão consolidada com dados reais do Supabase
  const overview = coldRoomService.calculateOverview(schedules);

  // Cálculos do simulador interativo
  const totalSimUnits =
    simCounts.bovino * COLD_ROOM_RATIOS.bovino +
    simCounts.suino * COLD_ROOM_RATIOS.suino +
    simCounts.cordeiro * COLD_ROOM_RATIOS.cordeiro +
    simCounts.leitao * COLD_ROOM_RATIOS.leitao;

  const remUnits = Math.max(0, COLD_ROOM_CAPACITY - totalSimUnits);
  const simOccupancyPct = ((totalSimUnits / COLD_ROOM_CAPACITY) * 100).toFixed(1);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Câmara Fria & Ocupação"
          description="Monitoramento em tempo real do espaço disponível, capacidade por espécie e balanço de ocupação via Supabase"
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
            <button
              onClick={() => setSimCounts({ bovino: 0, suino: 0, cordeiro: 0, leitao: 0 })}
              className="text-xs bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium px-3 py-1.5 rounded transition-colors shadow-sm"
            >
              Zerar Simulador
            </button>
          </div>

          {/* PAINEL DE OCUPAÇÃO POR ESPÉCIE & PROJEÇÃO SEMANAL */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Capacidade & Ocupação Atual por Espécie (Supabase)
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

          {/* CALCULADORA & SIMULADOR DE ESPAÇO */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-slate-700" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Calculadora & Simulador Dinâmico de Espaço</h3>
                  <p className="text-[11px] text-slate-500">
                    Ajuste a quantidade por espécie para simular instantaneamente o consumo de câmara fria
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-100 text-slate-800">
                Simulado: {totalSimUnits.toFixed(1)} un ({simOccupancyPct}%) | Livre: {remUnits.toFixed(1)} un
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* BOVINO */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Beef className="w-3.5 h-3.5 text-slate-600" /> Bovinos
                  </span>
                  <span className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-mono font-semibold text-[10px]">
                    1.0x
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  value={simCounts.bovino}
                  onChange={(e) => handleSimCountChange('bovino', Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-slate-800"
                />
                <div className="mt-2 pt-1.5 border-t border-slate-200 flex justify-between text-[11px]">
                  <span className="text-slate-500">Ocupado:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {(simCounts.bovino * COLD_ROOM_RATIOS.bovino).toFixed(1)} un
                  </span>
                </div>
              </div>

              {/* SUÍNO */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <PiggyBank className="w-3.5 h-3.5 text-slate-600" /> Suínos
                  </span>
                  <span className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-mono font-semibold text-[10px]">
                    1.5x
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  value={simCounts.suino}
                  onChange={(e) => handleSimCountChange('suino', Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-slate-800"
                />
                <div className="mt-2 pt-1.5 border-t border-slate-200 flex justify-between text-[11px]">
                  <span className="text-slate-500">Ocupado:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {(simCounts.suino * COLD_ROOM_RATIOS.suino).toFixed(1)} un
                  </span>
                </div>
              </div>

              {/* CORDEIRO */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-slate-600" /> Cordeiros
                  </span>
                  <span className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-mono font-semibold text-[10px]">
                    0.5x
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  value={simCounts.cordeiro}
                  onChange={(e) => handleSimCountChange('cordeiro', Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-slate-800"
                />
                <div className="mt-2 pt-1.5 border-t border-slate-200 flex justify-between text-[11px]">
                  <span className="text-slate-500">Ocupado:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {(simCounts.cordeiro * COLD_ROOM_RATIOS.cordeiro).toFixed(1)} un
                  </span>
                </div>
              </div>

              {/* LEITÃO */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-slate-600" /> Leitões
                  </span>
                  <span className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-mono font-semibold text-[10px]">
                    0.3x
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  value={simCounts.leitao}
                  onChange={(e) => handleSimCountChange('leitao', Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-slate-800"
                />
                <div className="mt-2 pt-1.5 border-t border-slate-200 flex justify-between text-[11px]">
                  <span className="text-slate-500">Ocupado:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {(simCounts.leitao * COLD_ROOM_RATIOS.leitao).toFixed(1)} un
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
