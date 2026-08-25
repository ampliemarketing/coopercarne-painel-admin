import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ModalOverlay, ModalHeader, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { useUsersQuery } from '../../hooks/useUsers';
import { useCreateScheduleMutation } from '../../hooks/useSchedules';

export function AddScheduleModal({ onClose }: { onClose: () => void }) {
  const { data: users = [] } = useUsersQuery();
  const createScheduleMutation = useCreateScheduleMutation();

  const [newSchedule, setNewSchedule] = useState({
    userId: '',
    animalType: 'bovino' as 'bovino' | 'suino' | 'cordeiro' | 'leitao',
    quantity: 5,
    scheduledDate: new Date().toISOString().split('T')[0],
    slaughterDate: new Date().toISOString().split('T')[0],
    gtaNumber: '',
    observacoes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find((u) => u.id === newSchedule.userId);
    if (!user) {
      toast.error('Selecione um cooperado ou terceiro.');
      return;
    }

    if (user.status === 'blocked') {
      toast.error(`AGENDAMENTO REJEITADO: ${user.name} está com acesso bloqueado.`);
      return;
    }

    createScheduleMutation.mutate(
      {
        userId: user.id,
        animalType: newSchedule.animalType,
        quantity: Number(newSchedule.quantity),
        scheduledDate: newSchedule.scheduledDate,
        slaughterDate: newSchedule.slaughterDate,
        gtaNumber: newSchedule.gtaNumber.trim() || undefined,
        observacoes: newSchedule.observacoes.trim() || undefined,
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
      <ModalHeader title="Novo Agendamento & GTA (Supabase)" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div>
          <FormLabel>Cooperado / Terceiro *</FormLabel>
          <select
            value={newSchedule.userId}
            onChange={(e) => setNewSchedule({ ...newSchedule, userId: e.target.value })}
            className={inputCls}
            required
            disabled={createScheduleMutation.isPending}
          >
            <option value="">Selecione o produtor...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.type === 'terceiro' ? 'Terceiro - Requer Aprovação' : 'Cooperado'})
                {u.status === 'blocked' ? ' [BLOQUEADO]' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Tipo de Animal *</FormLabel>
            <select
              value={newSchedule.animalType}
              onChange={(e) =>
                setNewSchedule({ ...newSchedule, animalType: e.target.value as any })
              }
              className={inputCls}
              disabled={createScheduleMutation.isPending}
            >
              <option value="bovino">Bovino (1.0x)</option>
              <option value="suino">Suíno (1.5x)</option>
              <option value="cordeiro">Cordeiro (0.5x)</option>
              <option value="leitao">Leitão (0.3x)</option>
            </select>
          </div>
          <div>
            <FormLabel>Quantidade de Cabeças *</FormLabel>
            <input
              type="number"
              min={1}
              value={newSchedule.quantity}
              onChange={(e) =>
                setNewSchedule({ ...newSchedule, quantity: Number(e.target.value) })
              }
              className={inputCls}
              required
              disabled={createScheduleMutation.isPending}
            />
          </div>
        </div>

        <div>
          <FormLabel>Número da GTA (Guia Sanitária)</FormLabel>
          <input
            type="text"
            value={newSchedule.gtaNumber}
            onChange={(e) => setNewSchedule({ ...newSchedule, gtaNumber: e.target.value })}
            placeholder="Ex: GTA-88910-PR"
            className={inputCls}
            disabled={createScheduleMutation.isPending}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Data do Agendamento</FormLabel>
            <input
              type="date"
              value={newSchedule.scheduledDate}
              onChange={(e) =>
                setNewSchedule({ ...newSchedule, scheduledDate: e.target.value })
              }
              className={inputCls}
              disabled={createScheduleMutation.isPending}
            />
          </div>
          <div>
            <FormLabel>Data Prevista do Abate *</FormLabel>
            <input
              type="date"
              value={newSchedule.slaughterDate}
              onChange={(e) =>
                setNewSchedule({ ...newSchedule, slaughterDate: e.target.value })
              }
              className={inputCls}
              required
              disabled={createScheduleMutation.isPending}
            />
          </div>
        </div>

        <div>
          <FormLabel>Observações Operacionais</FormLabel>
          <textarea
            rows={2}
            value={newSchedule.observacoes}
            onChange={(e) => setNewSchedule({ ...newSchedule, observacoes: e.target.value })}
            placeholder="Ex: Lote rastreado Sisbov. Descarregar no curral 3."
            className={inputCls + ' resize-none text-xs'}
            disabled={createScheduleMutation.isPending}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={createScheduleMutation.isPending}
            className={btnSecondary}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createScheduleMutation.isPending}
            className={btnPrimary + ' flex items-center gap-1.5'}
          >
            {createScheduleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{createScheduleMutation.isPending ? 'Validando & Salvando...' : 'Agendar Lote'}</span>
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
