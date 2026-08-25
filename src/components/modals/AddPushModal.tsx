import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ModalOverlay, ModalHeader, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { useSendPushMutation } from '../../hooks/useCommunication';
import { useAuth } from '../../store/AuthContext';

export function AddPushModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const sendPushMutation = useSendPushMutation();
  const [newPush, setNewPush] = useState({
    title: '',
    message: '',
    targetAudience: 'todos' as 'todos' | 'cooperados' | 'terceiros',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPush.title.trim() || !newPush.message.trim()) {
      toast.error('Preencha o título e a mensagem da notificação.');
      return;
    }

    sendPushMutation.mutate(
      {
        input: {
          title: newPush.title.trim(),
          message: newPush.message.trim(),
          targetAudience: newPush.targetAudience,
        },
        adminId: user?.id,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Disparar Notificação Push" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
        <div>
          <FormLabel>Título do Alerta *</FormLabel>
          <input
            type="text"
            value={newPush.title}
            onChange={(e) => setNewPush({ ...newPush, title: e.target.value })}
            className={inputCls}
            placeholder="Ex: Atualização da Escala de Abate"
            required
            disabled={sendPushMutation.isPending}
          />
        </div>
        <div>
          <FormLabel>Público Alvo</FormLabel>
          <select
            value={newPush.targetAudience}
            onChange={(e) => setNewPush({ ...newPush, targetAudience: e.target.value as any })}
            className={inputCls}
            disabled={sendPushMutation.isPending}
          >
            <option value="todos">Todos os Usuários (Cooperados e Terceiros)</option>
            <option value="cooperados">Apenas Cooperados</option>
            <option value="terceiros">Apenas Terceiros</option>
          </select>
        </div>
        <div>
          <FormLabel>Mensagem Push *</FormLabel>
          <textarea
            rows={3}
            value={newPush.message}
            onChange={(e) => setNewPush({ ...newPush, message: e.target.value })}
            className={inputCls + ' resize-none'}
            placeholder="Digite a mensagem que aparecerá nos celulares dos produtores..."
            required
            disabled={sendPushMutation.isPending}
          />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={sendPushMutation.isPending}
            className={btnSecondary}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={sendPushMutation.isPending}
            className={btnPrimary + ' flex items-center gap-1.5'}
          >
            {sendPushMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{sendPushMutation.isPending ? 'Disparando...' : 'Disparar Push'}</span>
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

