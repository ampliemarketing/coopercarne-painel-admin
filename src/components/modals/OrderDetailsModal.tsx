import { useState } from 'react';
import {
  Package,
  User,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Loader2,
} from 'lucide-react';
import { ModalOverlay, ModalHeader, btnSecondary, btnPrimary } from '../ui';
import { useUpdateOrderStatusMutation } from '../../hooks/useOrders';
import { useAuth } from '../../store/AuthContext';
import type { Order, OrderStatus } from '../../types';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  rascunho: {
    label: 'Rascunho',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: Clock,
  },
  enviado: {
    label: 'Enviado',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
    icon: Clock,
  },
  em_analise: {
    label: 'Em Análise',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
    icon: AlertCircle,
  },
  em_producao: {
    label: 'Em Produção / Preparo',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-300',
    icon: Package,
  },
  pronto_retirada: {
    label: 'Pronto para Retirada',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-300',
    icon: CheckCircle2,
  },
  em_transito: {
    label: 'Em Trânsito',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    icon: Truck,
  },
  entregue: {
    label: 'Entregue / Concluído',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-300',
    icon: CheckCircle2,
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
    icon: AlertCircle,
  },
};

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const { user } = useAuth();
  const updateStatusMutation = useUpdateOrderStatusMutation();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);

  const currentCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.enviado;
  const CurrentIcon = currentCfg.icon;

  const handleStatusChange = (newStatus: OrderStatus) => {
    setSelectedStatus(newStatus);
    updateStatusMutation.mutate({
      orderId: order.id,
      newStatus,
      adminId: user?.id,
      userName: user?.user_metadata?.nome || user?.email || 'Administrador',
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informada';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const totalWeight = order.items.reduce((acc, it) => acc + (it.quantityKg || 0), 0);

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader
        title={`Detalhes do Pedido ${order.code}`}
        onClose={onClose}
      />

      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Cabeçalho do Pedido com Status Atual */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-800 tracking-tight">{order.code}</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentCfg.bg} ${currentCfg.text} ${currentCfg.border}`}
              >
                <CurrentIcon className="w-3.5 h-3.5" />
                {currentCfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Criado em: <span className="font-semibold text-slate-700">{formatDate(order.createdAt)}</span>
            </p>
          </div>

          {/* Alterador Rápido de Status */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Alterar Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              disabled={updateStatusMutation.isPending}
              className="text-xs font-bold px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-800 shadow-xs focus:ring-2 focus:ring-[#c51d1f] focus:outline-hidden"
            >
              <option value="enviado">Enviado</option>
              <option value="em_analise">Em Análise</option>
              <option value="em_producao">Em Produção / Preparo</option>
              <option value="pronto_retirada">Pronto para Retirada</option>
              <option value="em_transito">Em Trânsito</option>
              <option value="entregue">Entregue / Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
            {updateStatusMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin text-[#c51d1f]" />
            )}
          </div>
        </div>

        {/* Informações do Cooperado e Entrega */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dados do Cooperado */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5 text-[#c51d1f]" />
              Cooperado / Solicitante
            </h4>
            <div>
              <span className="text-sm font-bold text-slate-800">{order.userName}</span>
              {order.establishmentName && (
                <p className="text-xs text-slate-500 font-medium">{order.establishmentName}</p>
              )}
            </div>
            {order.phone && (
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Telefone:</span> {order.phone}
              </p>
            )}
            {order.email && (
              <p className="text-xs text-slate-600">
                <span className="font-semibold">E-mail:</span> {order.email}
              </p>
            )}
            <div className="pt-1">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                {order.userType === 'terceiro' ? 'Terceiro' : 'Cooperado'}
              </span>
            </div>
          </div>

          {/* Dados da Entrega */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-[#c51d1f]" />
              Local & Previsão de Retirada
            </h4>
            <p className="text-xs text-slate-700">
              <span className="font-bold">Local:</span> {order.deliveryLocation}
            </p>
            <p className="text-xs text-slate-700">
              <span className="font-bold">Data Desejada:</span> {formatDate(order.desiredDeliveryDate)}
            </p>
            <p className="text-xs text-slate-700">
              <span className="font-bold">Espécie:</span>{' '}
              <span className="capitalize font-bold text-[#c51d1f]">{order.meatType}</span>
            </p>
          </div>
        </div>

        {/* Tabela de Cortes / Itens: Carcaças, Quartos & Miúdos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#c51d1f]" />
              Discriminação de Carcaças, Quartos & Miúdos ({order.items.length})
            </h4>
            <span className="text-[11px] font-semibold text-slate-500">
              Operacional Exclusivo: Carcaça • Quartos • Miúdos
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Tipo / Categoria</th>
                  <th className="px-4 py-2.5">Item / Discriminação</th>
                  <th className="px-4 py-2.5 text-center">Peças / Qtd</th>
                  <th className="px-4 py-2.5 text-center">Peso Total (kg)</th>
                  <th className="px-4 py-2.5 text-left">Especificações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item) => {
                  const catBadge =
                    item.category === 'carcaca'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : item.category === 'quarto'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  const catLabel =
                    item.category === 'carcaca'
                      ? 'Carcaça'
                      : item.category === 'quarto'
                      ? 'Quarto'
                      : 'Miúdos';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${catBadge}`}>
                          {catLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">{item.cutName}</td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-700">
                        {item.piecesCount || 1} un
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-black text-slate-900">
                        {item.quantityKg.toFixed(2)} kg
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 italic">
                        {item.notes || 'Padrão frigorífico'}
                      </td>
                    </tr>
                  );
                })}

                {order.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Nenhum item discriminado no pedido.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-slate-700 uppercase tracking-wide">
                    Total Geral Estimado:
                  </td>
                  <td className="px-4 py-3 text-center text-base text-[#c51d1f] font-black font-mono">
                    {totalWeight > 0 ? `${totalWeight.toFixed(2)} kg` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-normal">
                    {order.items.length} item(ns) listado(s)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Observações */}
        {order.notes && (
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
            <h5 className="text-[11px] font-bold uppercase text-amber-800 tracking-wider mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Observações do Cooperado
            </h5>
            <p className="text-xs text-amber-900 italic">{order.notes}</p>
          </div>
        )}

        {/* Ações de Rodapé */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className={btnSecondary}
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            {order.status !== 'pronto_retirada' && order.status !== 'entregue' && (
              <button
                type="button"
                onClick={() => handleStatusChange('pronto_retirada')}
                disabled={updateStatusMutation.isPending}
                className="px-3 py-2 rounded text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Marcar Pronto para Retirada
              </button>
            )}

            {order.status !== 'entregue' && (
              <button
                type="button"
                onClick={() => handleStatusChange('entregue')}
                disabled={updateStatusMutation.isPending}
                className={btnPrimary + ' flex items-center gap-1.5'}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Dar Baixa / Entregue</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
