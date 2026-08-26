import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ModalOverlay, ModalHeader, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { useFinalizarAbateMutation } from '../../hooks/useSchedules';
import type { SlaughterSchedule } from '../../types';

export function FinalizarAbateModal({
  schedule,
  onClose,
}: {
  schedule: SlaughterSchedule;
  onClose: () => void;
}) {
  const finalizarAbateMutation = useFinalizarAbateMutation();
  const [quantidadePerda, setQuantidadePerda] = useState(0);

  const quantidadeRecebida = schedule.quantidadeRecebida ?? schedule.quantity;
  const quantidadeProcessada = Math.max(0, quantidadeRecebida - quantidadePerda);

  const handleSave = () => {
    finalizarAbateMutation.mutate(
      {
        scheduleId: schedule.id,
        quantidadePerda,
        userName: schedule.userName,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title={`Finalizar Abate — ${schedule.userName}`} onClose={onClose} />
      <div className="p-5 space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs space-y-1">
          <div>
            <span className="font-bold text-gray-700">Espécie:</span>{' '}
            <span className="capitalize font-bold text-red-700">{schedule.animalType}</span>
          </div>
          <div>
            <span className="font-bold text-gray-700">Recebido no curral:</span> {quantidadeRecebida} cabeças
          </div>
        </div>

        <div>
          <FormLabel>Perda (cabeças) — opcional</FormLabel>
          <input
            type="number"
            min={0}
            max={quantidadeRecebida}
            value={quantidadePerda}
            onChange={(e) => setQuantidadePerda(Number(e.target.value))}
            className={inputCls + ' text-base font-bold text-red-700'}
            disabled={finalizarAbateMutation.isPending}
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Quantidade de animais perdidos no processo, se houver. Deixe 0 se não houve perda.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs">
          <span className="font-bold text-emerald-800">Quantidade Processada Final:</span>{' '}
          <span className="font-bold text-emerald-900">{quantidadeProcessada} cabeças</span>
          <p className="text-emerald-700 mt-0.5">Recebido ({quantidadeRecebida}) − Perda ({quantidadePerda})</p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={finalizarAbateMutation.isPending}
            className={btnSecondary}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={finalizarAbateMutation.isPending}
            className={btnPrimary + ' flex items-center gap-1.5'}
          >
            {finalizarAbateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{finalizarAbateMutation.isPending ? 'Salvando...' : 'Finalizar Abate'}</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
