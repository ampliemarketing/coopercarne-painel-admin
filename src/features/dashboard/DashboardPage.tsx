import { useState } from 'react';
import {
  CalendarDays,
  Thermometer,
  Clock,
  MessageSquare,
  Truck,
  ChevronRight,
  Newspaper,
  Download,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatCard, SpeciesDonutCard, Badge, btnSecondary } from '../../components/ui';
import { EditQuoteModal } from '../../components/modals/EditQuoteModal';
import { exportToCSV } from '../../hooks/useExportCSV';
import { COLD_ROOM_CAPACITY } from '../../constants';
import { useSchedulesQuery } from '../../hooks/useSchedules';
import { useTicketsQuery } from '../../hooks/useTickets';
import { useQuotesQuery } from '../../hooks/useCommunication';
import { useDeliveriesQuery } from '../../hooks/useDeliveries';
import { coldRoomService } from '../../services/coldRoomService';

export function DashboardPage() {
  const navigate = useNavigate();

  // Carrega agendamentos, chamados, cotações e entregas reais do Supabase
  const { data: schedules = [] } = useSchedulesQuery();
  const { data: tickets = [] } = useTicketsQuery();
  const { data: dailyQuotes = [] } = useQuotesQuery();
  const { data: deliveries = [] } = useDeliveriesQuery();

  const [editingQuote, setEditingQuote] = useState<{
    id: string;
    name: string;
    price: number;
    variation: number;
  } | null>(null);

  const overview = coldRoomService.calculateOverview(schedules);
  const totalHeads = schedules.reduce((acc, curr) => acc + curr.quantity, 0);
  const pendingThirdParty = schedules.filter(
    (s) => s.userType === 'terceiro' && s.status === 'pendente_aprovacao'
  ).length;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Visão Geral Operacional"
          description="Indicadores consolidados de abate, câmara fria, chamados, cotações e entregas via Supabase"
        />
        <button
          onClick={() =>
            exportToCSV(
              'abates_resumo',
              ['Usuario', 'Tipo', 'Animal', 'Quantidade', 'Data_Abate', 'Taxa_Total'],
              schedules.map((s) => [
                s.userName,
                s.userType,
                s.animalType,
                s.quantity,
                s.slaughterDate,
                s.totalFee,
              ])
            )
          }
          className={btnSecondary + ' flex items-center gap-1.5 text-xs'}
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* GRID DE 5 CARDS KPI ESSENCIAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Agendamentos"
          value={`${totalHeads} cab`}
          sub="Escala acumulada"
          icon={CalendarDays}
          badge="+14% mês"
        />
        <StatCard
          label="Câmara Fria"
          value={`${overview.occupancyPercentage}%`}
          sub={`${overview.totalOccupiedUnits} / ${COLD_ROOM_CAPACITY} un.`}
          icon={Thermometer}
          badge={overview.isOverCapacity ? 'Crítico' : 'Segura'}
        />
        <StatCard
          label="Abate Terceiros"
          value={`${pendingThirdParty} pend.`}
          sub="Aguardando aprovação"
          icon={Clock}
          badge="Prioritário"
        />
        <StatCard
          label="Chamados Ativos"
          value={String(tickets.filter((t) => t.status !== 'resolvido').length)}
          sub={`${tickets.filter((t) => t.status === 'aberto').length} abertos`}
          icon={MessageSquare}
          badge="Suporte"
        />
        <StatCard
          label="Entregas Miúdos"
          value={`${deliveries.filter((d) => d.carcassDelivered).length} / ${deliveries.length}`}
          sub="Carcaças liberadas"
          icon={Truck}
        />
      </div>

      {/* PAINEL DE COTAÇÕES DO DIA */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[#c51d1f]" /> Cotações do Dia & Mercado BI (Supabase)
            </h3>
            <p className="text-xs text-slate-500">
              Valores de referência sincronizados com <code>precos_referencia</code> e <code>precos_historico</code>
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            Atualizado Hoje
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {dailyQuotes.map((q) => (
            <div
              key={q.id}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3 relative group hover:border-[#c51d1f] transition-all"
            >
              <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">
                {q.name}
              </span>
              <div className="text-base font-extrabold text-slate-900 mt-1">
                R$ {q.price.toFixed(2)}{' '}
                <span className="text-[10px] text-slate-500 font-normal">/{q.unit}</span>
              </div>
              <div
                className={`text-[10px] font-bold mt-1 ${
                  q.variation >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {q.variation >= 0 ? `▲ +${q.variation}%` : `▼ ${q.variation}%`}
              </div>
              <button
                onClick={() =>
                  setEditingQuote({
                    id: q.id,
                    name: q.name,
                    price: q.price,
                    variation: q.variation,
                  })
                }
                className="mt-2 w-full text-[10px] bg-white border border-slate-300 text-slate-700 py-1 rounded font-semibold hover:bg-slate-100 transition-colors"
              >
                Editar Preço
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO DE GRÁFICOS DONUT POR ESPÉCIE */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
            Capacidade & Ocupação por Espécie (Supabase)
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Programação real e saldo disponível de cabeças
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SpeciesDonutCard
            title="BOVINO"
            current={overview.bySpecies.bovino.units}
            capacity={overview.bySpecies.bovino.capacity}
          />
          <SpeciesDonutCard
            title="SUÍNO"
            current={overview.bySpecies.suino.units}
            capacity={overview.bySpecies.suino.capacity}
          />
          <SpeciesDonutCard
            title="CORDEIRO"
            current={overview.bySpecies.cordeiro.units}
            capacity={overview.bySpecies.cordeiro.capacity}
          />
          <SpeciesDonutCard
            title="LEITÃO"
            current={overview.bySpecies.leitao.units}
            capacity={overview.bySpecies.leitao.capacity}
          />
        </div>
      </div>

      {/* AGENDAMENTOS REAIS REGISTRADOS */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="text-sm font-bold text-gray-700">Agendamentos Recentes (Supabase)</span>
          <button
            onClick={() => navigate('/slaughter')}
            className="text-xs text-[#c51d1f] hover:underline flex items-center gap-1 font-semibold"
          >
            Ver todos na Agenda <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Usuário</th>
                <th className="text-left px-4 py-2 font-medium">Tipo</th>
                <th className="text-left px-4 py-2 font-medium">Espécie / Qtd</th>
                <th className="text-left px-4 py-2 font-medium">Guia GTA</th>
                <th className="text-left px-4 py-2 font-medium">Data Abate</th>
                <th className="text-left px-4 py-2 font-medium">Status Chegada</th>
                <th className="text-right px-4 py-2 font-medium">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {schedules.slice(0, 6).map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{item.userName}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={item.userType === 'cooperado' ? 'blue' : 'purple'}>
                      {item.userType}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 capitalize text-gray-600">
                    {item.animalType} ({item.quantity})
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">
                    {item.gtaNumber || 'Sem GTA'}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{item.slaughterDate}</td>
                  <td className="px-4 py-2.5">
                    {item.arrivalConfirmed ? (
                      <span className="text-green-700 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
                      </span>
                    ) : item.noShowAlert ? (
                      <span className="text-amber-700 text-xs font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Ausente
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Aguardando
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-green-700">
                    R$ {item.totalFee.toFixed(2)}
                  </td>
                </tr>
              ))}

              {schedules.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                    Nenhum agendamento recente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDITAR COTAÇÃO */}
      {editingQuote && (
        <EditQuoteModal
          quoteId={editingQuote.id}
          quoteName={editingQuote.name}
          currentPrice={editingQuote.price}
          currentVariation={editingQuote.variation}
          onClose={() => setEditingQuote(null)}
        />
      )}
    </div>
  );
}
