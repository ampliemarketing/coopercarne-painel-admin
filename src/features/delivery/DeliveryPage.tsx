import React, { useState } from 'react';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Search,
  Eye,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useDeliveriesQuery, useUpdateDeliveryMutation } from '../../hooks/useDeliveries';
import { useOrdersQuery, useUpdateOrderStatusMutation } from '../../hooks/useOrders';
import { OrderDetailsModal } from '../../components/modals/OrderDetailsModal';
import { useAuth } from '../../store/AuthContext';
import type { Order, OrderStatus } from '../../types';

type DeliveryTab = 'orders' | 'slaughter';

const STATUS_FILTERS: { key: string; label: string; status?: OrderStatus }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'enviado', label: 'Enviados', status: 'enviado' },
  { key: 'em_producao', label: 'Em Preparo', status: 'em_producao' },
  { key: 'pronto_retirada', label: 'Prontos p/ Retirada', status: 'pronto_retirada' },
  { key: 'entregue', label: 'Entregues', status: 'entregue' },
  { key: 'rascunho', label: 'Rascunhos', status: 'rascunho' },
];

const ORDER_STATUS_STYLE: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  rascunho: { label: 'Rascunho', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  enviado: { label: 'Enviado', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  em_analise: { label: 'Em Análise', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  em_producao: { label: 'Em Preparo', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  pronto_retirada: { label: 'Pronto p/ Retirada', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  em_transito: { label: 'Em Trânsito', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  entregue: { label: 'Entregue', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  cancelado: { label: 'Cancelado', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

export function DeliveryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DeliveryTab>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Queries
  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    isError: isOrdersError,
    error: ordersError,
    refetch: refetchOrders,
    isFetching: isOrdersFetching,
  } = useOrdersQuery();

  const {
    data: deliveries = [],
    isLoading: isDeliveriesLoading,
    isError: isDeliveriesError,
    error: deliveriesError,
    refetch: refetchDeliveries,
    isFetching: isDeliveriesFetching,
  } = useDeliveriesQuery();

  // Mutations
  const updateOrderMutation = useUpdateOrderStatusMutation();
  const updateDeliveryMutation = useUpdateDeliveryMutation();

  const handleRefresh = () => {
    if (activeTab === 'orders') {
      refetchOrders();
    } else {
      refetchDeliveries();
    }
  };

  const handleToggleDeliveryItem = (
    deliveryId: string,
    field: 'carcass' | 'heart' | 'liver',
    currentVal: boolean,
    userName: string
  ) => {
    updateDeliveryMutation.mutate({
      deliveryId,
      itemType: field,
      delivered: !currentVal,
      adminId: user?.id,
      userName,
    });
  };

  const handleStatusAdvance = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: OrderStatus = 'em_producao';
    if (order.status === 'enviado' || order.status === 'em_analise') {
      nextStatus = 'em_producao';
    } else if (order.status === 'em_producao') {
      nextStatus = 'pronto_retirada';
    } else if (order.status === 'pronto_retirada' || order.status === 'em_transito') {
      nextStatus = 'entregue';
    } else {
      return;
    }

    updateOrderMutation.mutate({
      orderId: order.id,
      newStatus: nextStatus,
      adminId: user?.id,
      userName: user?.user_metadata?.nome || user?.email || 'Administrador',
    });
  };

  // Filtragem dos pedidos
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.establishmentName && ord.establishmentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ord.meatType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || ord.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const deliveredSlaughterCount = deliveries.filter((d) => d.carcassDelivered).length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // Helper para resumir as partes solicitadas no pedido
  const formatItemsSummary = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      return {
        main: `Carcaça & Partes (${order.meatType})`,
        sub: 'Aguardando pesagem/separação',
        weight: order.totalWeightKg > 0 ? `${order.totalWeightKg.toFixed(1)} kg` : 'A pesar',
      };
    }

    const names = order.items.map((i) => i.cutName).join(', ');
    const shortNames = names.length > 40 ? `${names.substring(0, 40)}...` : names;
    const totalKg = order.items.reduce((acc, it) => acc + (it.quantityKg || 0), 0);

    return {
      main: `${order.items.length} item(ns): ${shortNames}`,
      sub: order.totalPieces ? `${order.totalPieces} peça(s) no total` : `${order.items.length} corte(s)`,
      weight: totalKg > 0 ? `${totalKg.toFixed(1)} kg` : 'A pesar',
    };
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header Simplificado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Controle de Entregas & Expedição</span>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-red-50 text-[#c51d1f] rounded-full border border-red-200">
              Operacional
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Conferência e liberação física de carcaças, quartos e miúdos dos cooperados
          </p>
        </div>

        {/* Switcher de Abas Estilo Segmented Control + Botão Atualizar */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-[#c51d1f] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Pedidos Cooperados</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'orders' ? 'bg-[#c51d1f] text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('slaughter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'slaughter'
                  ? 'bg-white text-[#c51d1f] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Saída do Frigorífico</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'slaughter' ? 'bg-[#c51d1f] text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {deliveries.length}
              </span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isOrdersFetching || isDeliveriesFetching}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isOrdersFetching || isDeliveriesFetching ? 'animate-spin text-[#c51d1f]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* =========================================================================
          ABA 1: PEDIDOS DE COOPERADOS (CARCAÇAS, QUARTOS E MIÚDOS)
         ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Barra de Filtros Rápidos (Chips) & Busca Integrada */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            {/* Status Chips com Contadores Integrados */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {STATUS_FILTERS.map((f) => {
                const count =
                  f.key === 'todos'
                    ? orders.length
                    : orders.filter((o) => o.status === f.status).length;

                const isSelected = statusFilter === f.key;

                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Campo de Busca Rápida */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar código, cooperado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#c51d1f] focus:outline-hidden text-slate-800"
              />
            </div>
          </div>

          {/* Tabela de Pedidos Ultra-Limpa */}
          {isOrdersLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-3 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/4" />
              <div className="h-32 bg-slate-100 rounded" />
            </div>
          ) : isOrdersError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar pedidos</h3>
              <p className="text-xs text-red-700">{ordersError?.message}</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Pedido</th>
                      <th className="px-4 py-3">Cooperado</th>
                      <th className="px-4 py-3">Carcaças, Quartos & Miúdos</th>
                      <th className="px-4 py-3">Previsão Retirada</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((ord) => {
                      const st = ORDER_STATUS_STYLE[ord.status] || ORDER_STATUS_STYLE.enviado;
                      const summary = formatItemsSummary(ord);

                      return (
                        <tr
                          key={ord.id}
                          onClick={() => setSelectedOrder(ord)}
                          className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                        >
                          {/* Código & Data */}
                          <td className="px-4 py-3.5">
                            <div className="font-mono font-black text-sm text-slate-900 group-hover:text-[#c51d1f] transition-colors">
                              {ord.code}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {formatDate(ord.createdAt)}
                            </div>
                          </td>

                          {/* Cooperado */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-800">{ord.userName}</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {ord.establishmentName || (ord.userType === 'terceiro' ? 'Terceiro' : 'Cooperado')}
                            </div>
                          </td>

                          {/* Carcaças, Quartos & Miúdos */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 capitalize bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                                {ord.meatType}
                              </span>
                              <span className="font-bold text-slate-700">{summary.weight}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[320px]">
                              {summary.main}
                            </div>
                          </td>

                          {/* Previsão & Local */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDate(ord.desiredDeliveryDate)}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {ord.deliveryLocation.replace('Matriz COOPERCARNE', 'Matriz')}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.bg} ${st.text} ${st.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </td>

                          {/* Ação Contextual Rápida + Ver Detalhes */}
                          <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botão contextual de acordo com a etapa do pedido */}
                              {ord.status === 'enviado' && (
                                <button
                                  onClick={(e) => handleStatusAdvance(ord, e)}
                                  disabled={updateOrderMutation.isPending}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-xs flex items-center gap-1"
                                  title="Iniciar preparo dos quartos/carcaças"
                                >
                                  <span>Preparo</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {ord.status === 'em_producao' && (
                                <button
                                  onClick={(e) => handleStatusAdvance(ord, e)}
                                  disabled={updateOrderMutation.isPending}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs flex items-center gap-1"
                                  title="Marcar pronto para retirada"
                                >
                                  <span>Pronto</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {ord.status === 'pronto_retirada' && (
                                <button
                                  onClick={(e) => handleStatusAdvance(ord, e)}
                                  disabled={updateOrderMutation.isPending}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs flex items-center gap-1"
                                  title="Dar baixa / confirmar entrega"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Entregar</span>
                                </button>
                              )}

                              {/* Botão de Detalhes */}
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors"
                                title="Ver detalhes completos"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400 text-xs font-medium">
                          Nenhum pedido encontrado com os filtros atuais.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ABA 2: SAÍDA DO FRIGORÍFICO (ABATES & CARCAÇAS)
         ========================================================================= */}
      {activeTab === 'slaughter' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-xs">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Conferência no Frigorífico:</span> Liberação individual de
              carcaça, coração e fígado com sincronização automática do espaço na câmara fria.
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
              Liberados: {deliveredSlaughterCount} / {deliveries.length}
            </span>
          </div>

          {isDeliveriesLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-3 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/4" />
              <div className="h-32 bg-slate-100 rounded" />
            </div>
          ) : isDeliveriesError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar abates</h3>
              <p className="text-xs text-red-700">{deliveriesError?.message}</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="text-left px-4 py-3">Produtor & Lote</th>
                    <th className="text-left px-4 py-3">Data Saída</th>
                    <th className="text-center px-4 py-3">Carcaça</th>
                    <th className="text-center px-4 py-3">Coração</th>
                    <th className="text-center px-4 py-3">Fígado</th>
                    <th className="text-left px-4 py-3">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.map((del) => (
                    <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">
                        <div>{del.userName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Lote #{del.id.substring(0, 8)}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{del.deliveryDate}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            handleToggleDeliveryItem(del.id, 'carcass', del.carcassDelivered, del.userName)
                          }
                          disabled={updateDeliveryMutation.isPending}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                            del.carcassDelivered
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-emerald-50'
                          }`}
                        >
                          {del.carcassDelivered ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Entregue
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-slate-400" /> Pendente
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            handleToggleDeliveryItem(del.id, 'heart', del.heartDelivered, del.userName)
                          }
                          disabled={updateDeliveryMutation.isPending}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                            del.heartDelivered
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-emerald-50'
                          }`}
                        >
                          {del.heartDelivered ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Entregue
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-slate-400" /> Pendente
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            handleToggleDeliveryItem(del.id, 'liver', del.liverDelivered, del.userName)
                          }
                          disabled={updateDeliveryMutation.isPending}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                            del.liverDelivered
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-emerald-50'
                          }`}
                        >
                          {del.liverDelivered ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Entregue
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-slate-400" /> Pendente
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 italic">
                        {del.notes || 'Sem observações'}
                      </td>
                    </tr>
                  ))}

                  {deliveries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-xs font-medium">
                        Nenhum lote de abate liberado para saída no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
