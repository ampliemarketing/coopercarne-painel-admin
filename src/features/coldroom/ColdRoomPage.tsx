import { useState } from 'react';
import { RefreshCw, AlertCircle, Search, Clock } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { useSchedulesQuery } from '../../hooks/useSchedules';
import { useCamaraFriaMovimentosQuery } from '../../hooks/useCamaraFriaMovimentos';
import { COLD_ROOM_MAX_DIAS_VALIDADE } from '../../constants';
import { coldRoomService, type ColdRoomPartStat, type ColdRoomCompanyStock, type ColdRoomLote } from '../../services/coldRoomService';

const ANIMAL_LABEL: Record<ColdRoomLote['animalType'], string> = {
  bovino: 'Bovino',
  suino: 'Suíno',
  cordeiro: 'Cordeiro',
  leitao: 'Leitão',
};

interface SpeciesGroup {
  title: string;
  note: string;
  accent: string;
  headsFinalized: number;
  parts: { partLabel: string; stat: ColdRoomPartStat }[];
}

function PartDonut({ partLabel, stat }: { partLabel: string; stat: ColdRoomPartStat }) {
  const pct = Math.min(100, Math.round(stat.percentage));
  const radius = 34;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{partLabel}</p>
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} className="text-slate-100" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={stat.isOverCapacity ? 'text-red-600' : 'text-slate-900'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-slate-900">
          {pct}%
        </span>
      </div>
      <p className="text-xs text-slate-600 font-medium">
        <strong className="text-slate-900 text-sm">{stat.occupied}</strong>/{stat.capacity} {stat.unit}
      </p>
      {stat.isOverCapacity && (
        <span className="text-[10px] font-bold text-red-600 uppercase">Excedido</span>
      )}
    </div>
  );
}

function SpeciesGroupCard({ group }: { group: SpeciesGroup }) {
  return (
    <div className={`bg-white border border-slate-200 border-t-4 ${group.accent} rounded-xl p-4 shadow-sm`}>
      <div className="text-center mb-4">
        <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900">{group.title}</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">{group.note}</p>
        <p className="text-[11px] text-slate-400">{group.headsFinalized} cabeça(s) abatida(s) em estoque</p>
      </div>
      <div className={`grid ${group.parts.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 justify-center`}>
        {group.parts.map((p) => (
          <PartDonut key={p.partLabel} partLabel={p.partLabel} stat={p.stat} />
        ))}
      </div>
    </div>
  );
}

function CompanyStockSearch({ companies }: { companies: ColdRoomCompanyStock[] }) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? companies.filter((c) => c.userName.toLowerCase().includes(search.trim().toLowerCase()))
    : companies;

  const sum = (pick: (c: ColdRoomCompanyStock) => number) => filtered.reduce((acc, c) => acc + pick(c), 0);
  const grandTotal = sum((c) => c.totalParts);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
            Estoque por Empresa / Produtor
          </h3>
          <p className="text-[11px] text-slate-500">Peças e cabeças ainda na câmara fria, aguardando entrega</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar empresa ou produtor..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c51d1f]/30 focus:border-[#c51d1f]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">
          {companies.length === 0
            ? 'Nenhuma empresa com estoque na câmara fria no momento.'
            : 'Nenhuma empresa encontrada para essa pesquisa.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="text-left text-slate-500 uppercase text-[10px] border-b border-slate-200">
                <th className="py-2 pr-3 font-bold">Empresa / Produtor</th>
                <th className="py-2 px-2 font-bold text-center">Bovino Dianteiro</th>
                <th className="py-2 px-2 font-bold text-center">Bovino Traseiro</th>
                <th className="py-2 px-2 font-bold text-center">Suíno Dianteiro</th>
                <th className="py-2 px-2 font-bold text-center">Suíno Traseiro</th>
                <th className="py-2 px-2 font-bold text-center">Cordeiro Dianteiro</th>
                <th className="py-2 px-2 font-bold text-center">Cordeiro Traseiro</th>
                <th className="py-2 px-2 font-bold text-center">Leitão</th>
                <th className="py-2 pl-2 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.userId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2 pr-3 font-semibold text-slate-900">{c.userName}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{c.bovino.dianteiro || '—'}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{c.bovino.traseiro || '—'}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{c.suino.dianteiro || '—'}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{c.suino.traseiro || '—'}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{c.cordeiro.dianteiro || '—'}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{c.cordeiro.traseiro || '—'}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{c.leitao || '—'}</td>
                  <td className="py-2 pl-2 text-right font-extrabold text-[#c51d1f]">{c.totalParts}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-extrabold text-slate-900">
                <td className="py-2 pr-3">Total {search.trim() ? 'filtrado' : 'geral'}</td>
                <td className="py-2 px-2 text-center">{sum((c) => c.bovino.dianteiro)}</td>
                <td className="py-2 px-2 text-center">{sum((c) => c.bovino.traseiro)}</td>
                <td className="py-2 px-2 text-center">{sum((c) => c.suino.dianteiro)}</td>
                <td className="py-2 px-2 text-center">{sum((c) => c.suino.traseiro)}</td>
                <td className="py-2 px-2 text-center">{sum((c) => c.cordeiro.dianteiro)}</td>
                <td className="py-2 px-2 text-center">{sum((c) => c.cordeiro.traseiro)}</td>
                <td className="py-2 px-2 text-center">{sum((c) => c.leitao)}</td>
                <td className="py-2 pl-2 text-right text-[#c51d1f]">{grandTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function LotesValidade({ lotes }: { lotes: ColdRoomLote[] }) {
  const vencidos = lotes.filter((l) => l.isVencido).length;
  const proximosDoVencimento = lotes.filter((l) => l.isProximoVencimento).length;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#c51d1f]" />
            Lotes em Estoque por Validade
          </h3>
          <p className="text-[11px] text-slate-500">
            Prazo sanitário máximo: {COLD_ROOM_MAX_DIAS_VALIDADE} dias após o abate. Consumo sempre pelo lote mais
            próximo de vencer (FEFO).
          </p>
        </div>
        {(vencidos > 0 || proximosDoVencimento > 0) && (
          <div className="flex items-center gap-2">
            {vencidos > 0 && (
              <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                {vencidos} lote(s) vencido(s)
              </span>
            )}
            {proximosDoVencimento > 0 && (
              <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                {proximosDoVencimento} vencendo em breve
              </span>
            )}
          </div>
        )}
      </div>

      {lotes.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">Nenhum lote com saldo em estoque no momento.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="text-left text-slate-500 uppercase text-[10px] border-b border-slate-200">
                <th className="py-2 pr-3 font-bold">Validade</th>
                <th className="py-2 px-2 font-bold">Empresa / Produtor</th>
                <th className="py-2 px-2 font-bold">Espécie</th>
                <th className="py-2 px-2 font-bold text-center">Finalizado em</th>
                <th className="py-2 px-2 font-bold text-center">Dianteiro</th>
                <th className="py-2 px-2 font-bold text-center">Traseiro</th>
                <th className="py-2 pl-2 font-bold text-right">Saldo Total</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => {
                const badge = l.isVencido
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : l.isProximoVencimento
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                const label = l.isVencido
                  ? `Vencido há ${Math.abs(l.diasRestantes)}d`
                  : l.diasRestantes === 0
                  ? 'Vence hoje'
                  : `${l.diasRestantes}d restante(s)`;

                return (
                  <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                        {label}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-semibold text-slate-900">{l.userName}</td>
                    <td className="py-2 px-2 text-slate-600">{ANIMAL_LABEL[l.animalType]}</td>
                    <td className="py-2 px-2 text-center text-slate-500">
                      {new Date(l.finalizadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600">
                      {l.animalType === 'leitao' ? '—' : l.saldoDianteiro || '—'}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600">
                      {l.animalType === 'leitao' ? '—' : l.saldoTraseiro || '—'}
                    </td>
                    <td className="py-2 pl-2 text-right font-extrabold text-[#c51d1f]">
                      {l.saldoTotal} {l.animalType === 'leitao' ? 'cab.' : 'peças'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ColdRoomPage() {
  const { data: schedules = [], isLoading, isError, error, refetch, isFetching } = useSchedulesQuery();
  const { data: movimentos = [] } = useCamaraFriaMovimentosQuery();

  // Calcula o estoque em peças (dianteiro/traseiro) com dados reais do Supabase
  const overview = coldRoomService.calculateOverview(schedules, movimentos);
  const companyStock = coldRoomService.calculateStockByCompany(schedules, movimentos);
  const lotes = coldRoomService.buildLotes(schedules, movimentos);

  const groups: SpeciesGroup[] = [
    {
      title: 'Bovino',
      note: '1 cabeça = 2 dianteiros + 2 traseiros',
      accent: 'border-t-[#c51d1f]',
      headsFinalized: overview.bovino.headsFinalized,
      parts: [
        { partLabel: 'Dianteiro', stat: overview.bovino.dianteiro },
        { partLabel: 'Traseiro', stat: overview.bovino.traseiro },
      ],
    },
    {
      title: 'Suíno',
      note: '1 cabeça = 1 dianteiro + 1 traseiro',
      accent: 'border-t-amber-500',
      headsFinalized: overview.suino.headsFinalized,
      parts: [
        { partLabel: 'Dianteiro', stat: overview.suino.dianteiro },
        { partLabel: 'Traseiro', stat: overview.suino.traseiro },
      ],
    },
    {
      title: 'Cordeiro',
      note: '1 cabeça = 1 dianteiro + 1 traseiro',
      accent: 'border-t-blue-500',
      headsFinalized: overview.cordeiro.headsFinalized,
      parts: [
        { partLabel: 'Dianteiro', stat: overview.cordeiro.dianteiro },
        { partLabel: 'Traseiro', stat: overview.cordeiro.traseiro },
      ],
    },
    {
      title: 'Leitão',
      note: 'Controlado por cabeça (não é dividido em partes)',
      accent: 'border-t-purple-500',
      headsFinalized: overview.leitao.headsFinalized,
      parts: [{ partLabel: 'Cabeças', stat: overview.leitao.unidade }],
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Câmara Fria & Ocupação"
          description="Estoque em tempo real de peças (dianteiro/traseiro) por espécie, geradas a partir dos abates finalizados"
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
        <div className="space-y-3 animate-pulse">
          <div className="h-14 bg-white border border-slate-200 rounded-lg" />
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
          <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
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
                  Estoque total: <strong className="text-slate-900">{overview.totalOccupied}</strong> de{' '}
                  {overview.totalCapacity} (peças + cabeças de leitão).
                </span>
                <span className="text-slate-500">
                  Livre restante: <strong className="text-slate-900">{overview.remainingUnits}</strong>.
                </span>
                {overview.isOverCapacity && (
                  <span className="text-red-600 font-semibold">
                    Excedido em: {overview.overCapacityLabels.join(', ')}.
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mb-3 px-1">
            Entra em estoque quando o abate é finalizado. A baixa é automática e por lote (FEFO) ao marcar um
            pedido classificado como "Entregue" na tela de Entregas — sempre descontando primeiro do lote mais
            próximo do limite de {COLD_ROOM_MAX_DIAS_VALIDADE} dias.
          </p>

          {/* UM CARD POR ESPÉCIE, TÍTULO EM CIMA E OS GRÁFICOS DE DIANTEIRO/TRASEIRO EMBAIXO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {groups.map((g) => (
              <SpeciesGroupCard key={g.title} group={g} />
            ))}
          </div>

          {/* LOTES EM ESTOQUE COM VALIDADE (REGRA DOS 6 DIAS) E ORDEM FEFO */}
          <LotesValidade lotes={lotes} />

          {/* PESQUISA DE EMPRESAS/PRODUTORES E TOTAL DE ESTOQUE POR CLIENTE */}
          <CompanyStockSearch companies={companyStock} />
        </>
      )}
    </div>
  );
}
