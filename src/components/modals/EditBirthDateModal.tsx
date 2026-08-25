import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalOverlay, ModalHeader, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { useUpdateBirthDateMutation } from '../../hooks/useUsers';

export function EditBirthDateModal({
  userId,
  userName,
  currentBirthDate,
  onClose,
}: {
  userId: string;
  userName: string;
  currentBirthDate: string;
  onClose: () => void;
}) {
  const updateBirthDateMutation = useUpdateBirthDateMutation();
  const [birthDate, setBirthDate] = useState(currentBirthDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBirthDateMutation.mutate(
      { userId, birthDate, userName },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Editar Data de Aniversário" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Produtor / Cooperado: <strong className="text-gray-800">{userName}</strong>
          </p>
          <FormLabel>Selecione a Data de Nascimento</FormLabel>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={inputCls}
            required
            disabled={updateBirthDateMutation.isPending}
          />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={updateBirthDateMutation.isPending}
            className={btnSecondary}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateBirthDateMutation.isPending}
            className={btnPrimary + ' flex items-center gap-1.5'}
          >
            {updateBirthDateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{updateBirthDateMutation.isPending ? 'Salvando...' : 'Salvar Data'}</span>
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
