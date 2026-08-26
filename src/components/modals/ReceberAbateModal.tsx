import { useState } from 'react';
import { Truck, Loader2 } from 'lucide-react';
import { ModalOverlay, ModalHeader, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { useMarcarRecebidoMutation } from '../../hooks/useSchedules';
import type { SlaughterSchedule } from '../../types';

export function ReceberAbateModal({
  schedule,
  onClose,
}: {
  schedule: SlaughterSchedule;
  onClose: () => void;
}) {
  const marcarRecebidoMutation = useMarcarRecebidoMutation();
  const [quantidadeRecebida, setQuantidadeRecebida] = useState(
    schedule.quantidadeConfirmada || schedule.quantity
  );

  const handleSave = () => {
    marcarRecebidoMutation.mutate(
      {
        scheduleId: schedule.id,
        quantidadeRecebida: quantidadeRecebida > 0 ? quantidadeRecebida : schedule.quantity,
        userName: schedule.userName,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title={`Marcar Recebido — ${schedule.userName}`} onClose={onClose} />
      <div className="p-5 space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs space-y-1">
          <div>
            <span className="font-bold text-gray-700">Espécie:</span>{' '}
            <span className="capitalize font-bold text-red-700">{schedule.animalType}</span>
          </div>
          <div>
            <span className="font-bold text-gray-700">Confirmado pelo produtor:</span>{' '}
            {schedule.quantidadeConfirmada ?? schedule.quantity} cabeças
          </div>
        </div>

        <div>
          <FormLabel>Quantas Cabeças Chegaram no Caminhão?</FormLabel>
          <input
            type="number"
            min={0}
            value={quantidadeRecebida}
            onChange={(e) => setQuantidadeRecebida(Number(e.target.value))}
            className={inputCls + ' text-base font-bold text-blue-800'}
            required
            disabled={marcarRecebidoMutation.isPending}
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Confira a contagem física na chegada. O agendamento vai para "Em Processo".
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={marcarRecebidoMutation.isPending}
            className={btnSecondary}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={marcarRecebidoMutation.isPending}
            className={btnPrimary + ' flex items-center gap-1.5'}
          >
            {marcarRecebidoMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Truck className="w-4 h-4" />
            )}
            <span>{marcarRecebidoMutation.isPending ? 'Salvando...' : 'Confirmar Recebido'}</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
