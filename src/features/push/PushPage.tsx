import { useState } from 'react';
import { Send, Bell, Loader2, Trash2 } from 'lucide-react';
import { PageHeader, Badge, btnPrimary } from '../../components/ui';
import { AddPushModal } from '../../components/modals/AddPushModal';
import { usePushNotificationsQuery, useDeleteNewsMutation } from '../../hooks/useCommunication';

export function PushPage() {
  const { data: pushNotifications = [], isLoading, isError, error } = usePushNotificationsQuery();
  const deleteMutation = useDeleteNewsMutation();
  const [isAddPushOpen, setIsAddPushOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <PageHeader
          title="Central de Notificações Push Direct"
          description="Envio de mensagens instantâneas e avisos operacionais para os celulares dos produtores"
        />
        <button
          onClick={() => setIsAddPushOpen(true)}
          className={btnPrimary + ' flex items-center gap-1.5'}
        >
          <Send className="w-4 h-4" /> Nova Notificação Push
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#c51d1f]" />
            <span className="text-sm font-medium">Carregando notificações do Supabase...</span>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600">
            <p className="font-semibold text-sm">Erro ao carregar notificações:</p>
            <p className="text-xs text-red-500 mt-1">{error?.message}</p>
          </div>
        ) : pushNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-[#c51d1f] mb-3">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Nenhuma Notificação Push Disparada</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4">
              Envie comunicados rápidos ou alertas urgentes diretamente para a tela de bloqueio dos cooperados e parceiros.
            </p>
            <button
              onClick={() => setIsAddPushOpen(true)}
              className={btnPrimary + ' flex items-center gap-1.5 text-xs'}
            >
              <Send className="w-3.5 h-3.5" /> Disparar Primeiro Push
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Título Notificação</th>
                <th className="text-left px-4 py-2.5 font-medium">Mensagem</th>
                <th className="text-left px-4 py-2.5 font-medium">Público Alvo</th>
                <th className="text-left px-4 py-2.5 font-medium">Disparado Em</th>
                <th className="text-right px-4 py-2.5 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pushNotifications.map((push) => (
                <tr key={push.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{push.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{push.message}</td>
                  <td className="px-4 py-3">
                    <Badge variant={push.targetAudience === 'cooperados' ? 'blue' : push.targetAudience === 'terceiros' ? 'purple' : 'green'}>
                      {push.targetAudience === 'cooperados' ? 'Cooperados' : push.targetAudience === 'terceiros' ? 'Terceiros' : 'Todos'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{push.sentAt}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente remover a notificação "${push.title}"?`)) {
                          deleteMutation.mutate(push.id);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Excluir notificação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isAddPushOpen && <AddPushModal onClose={() => setIsAddPushOpen(false)} />}
    </div>
  );
}

