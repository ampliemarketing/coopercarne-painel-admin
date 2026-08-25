import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalOverlay, ModalHeader, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { useUpdateQuoteMutation } from '../../hooks/useCommunication';
import { useAuth } from '../../store/AuthContext';

export function EditQuoteModal({
  quoteId,
  quoteName,
  currentPrice,
  currentVariation,
  onClose,
}: {
  quoteId: string;
  quoteName: string;
  currentPrice: number;
  currentVariation: number;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const updateQuoteMutation = useUpdateQuoteMutation();
  const [price, setPrice] = useState(String(currentPrice));
  const [variation, setVariation] = useState(String(currentVariation));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseFloat(price);

    updateQuoteMutation.mutate(
      {
        quoteId,
        quoteName,
        newPrice: priceVal,
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
      <ModalHeader title={`Atualizar Cotação — ${quoteName}`} onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <FormLabel>Preço de Referência no Supabase (R$)</FormLabel>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputCls + ' text-base font-bold text-slate-900'}
            required
            disabled={updateQuoteMutation.isPending}
          />
        </div>
        <div>
          <FormLabel>Variação Diária (%)</FormLabel>
          <input
            type="number"
            step="0.1"
            value={variation}
            onChange={(e) => setVariation(e.target.value)}
            className={inputCls}
            required
            disabled={updateQuoteMutation.isPending}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            O valor será salvo na tabela <code>precos_referencia</code> e arquivado no histórico.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={updateQuoteMutation.isPending}
            className={btnSecondary}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateQuoteMutation.isPending}
            className={btnPrimary + ' flex items-center gap-1.5'}
          >
            {updateQuoteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{updateQuoteMutation.isPending ? 'Salvando...' : 'Atualizar Preço'}</span>
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
