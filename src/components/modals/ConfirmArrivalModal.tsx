import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ModalOverlay, ModalHeader, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { useConfirmArrivalMutation } from '../../hooks/useSchedules';
import type { SlaughterSchedule } from '../../types';

export function ConfirmArrivalModal({
  schedule,
  onClose,
}: {
  schedule: SlaughterSchedule;
  onClose: () => void;
}) {
  const confirmArrivalMutation = useConfirmArrivalMutation();
  const [arrivalQtyInput, setArrivalQtyInput] = useState(
    schedule.confirmedQuantity || schedule.quantity
  );
  const [arrivalNotesInput, setArrivalNotesInput] = useState(schedule.arrivalNotes || '');

  const handleSave = () => {
    const confirmed = arrivalQtyInput > 0 ? arrivalQtyInput : schedule.quantity;
    confirmArrivalMutation.mutate(
      {
        scheduleId: schedule.id,
        confirmedQty: confirmed,
        notes: arrivalNotesInput.trim() || undefined,
        userName: schedule.userName,
        animalType: schedule.animalType,
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
      <ModalHeader title={`Confirmar Entregas no Curral — Lote #${schedule.id}`} onClose={onClose} />
      <div className="p-5 space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs space-y-1">
          <div>
            <span className="font-bold text-gray-700">Produtor:</span> {schedule.userName}
          </div>
          <div>
            <span className="font-bold text-gray-700">Espécie Agendada:</span>{' '}
            <span className="capitalize font-bold text-red-700">{schedule.animalType}</span>
          </div>
          <div>
            <span className="font-bold text-gray-700">Quantidade Solicitada via App:</span>{' '}
            {schedule.quantity} cabeças
          </div>
          <div>
            <span className="font-bold text-gray-700">Guia GTA:</span> {schedule.gtaNumber || 'Pendente'}
          </div>
        </div>

        <div>
          <FormLabel>Quantas Cabeças Chegaram Efetivamente ao Curral?</FormLabel>
          <input
            type="number"
            min={1}
            value={arrivalQtyInput}
            onChange={(e) => setArrivalQtyInput(Number(e.target.value))}
            className={inputCls + ' text-base font-bold text-green-800'}
            required
            disabled={confirmArrivalMutation.isPending}
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Insira a contagem física real dos animais descarregados no curral da COOPERCARNE.
          </p>
        </div>

        <div>
          <FormLabel>Observações do Operador de Curral / Câmara Fria</FormLabel>
          <textarea
            rows={2}
            value={arrivalNotesInput}
            onChange={(e) => setArrivalNotesInput(e.target.value)}
            className={inputCls + ' resize-none text-xs'}
            placeholder="Ex: 10 cabeças recebidas sem lesões. GTA conferida na balança."
            disabled={confirmArrivalMutation.isPending}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={confirmArrivalMutation.isPending}
            className={btnSecondary}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={confirmArrivalMutation.isPending}
            className={btnPrimary + ' flex items-center gap-1.5'}
          >
            {confirmArrivalMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{confirmArrivalMutation.isPending ? 'Salvando...' : 'Registrar Entrada Curral'}</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
