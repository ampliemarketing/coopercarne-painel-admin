import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ModalOverlay, ModalHeader, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { useCreateUserMutation } from '../../hooks/useUsers';

export function AddUserModal({ onClose }: { onClose: () => void }) {
  const createUserMutation = useCreateUserMutation();

  const [newUser, setNewUser] = useState({
    name: '',
    cpfCnpj: '',
    phone: '',
    email: '',
    type: 'cooperado' as 'cooperado' | 'terceiro',
    slaughterLimit: 20,
  });

  const formatCnpj = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 14);
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatTelefone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.cpfCnpj.trim()) {
      toast.error('Preencha os campos obrigatórios (Razão Social e CNPJ).');
      return;
    }

    createUserMutation.mutate(
      {
        name: newUser.name.trim(),
        cpfCnpj: newUser.cpfCnpj.trim(),
        phone: newUser.phone.trim() || undefined,
        email: newUser.email.trim() || undefined,
        type: newUser.type,
        slaughterLimit: Number(newUser.slaughterLimit),
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
      <ModalHeader title="Cadastrar Nova Empresa" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div>
          <FormLabel>Razão Social *</FormLabel>
          <input
            type="text"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className={inputCls}
            placeholder="Ex: Fazenda Santa Maria Ltda"
            required
            disabled={createUserMutation.isPending}
          />
        </div>

        <div>
          <FormLabel>CNPJ *</FormLabel>
          <input
            type="text"
            value={newUser.cpfCnpj}
            onChange={(e) => setNewUser({ ...newUser, cpfCnpj: formatCnpj(e.target.value) })}
            className={inputCls}
            placeholder="00.000.000/0001-00"
            required
            disabled={createUserMutation.isPending}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>E-mail de Contato</FormLabel>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className={inputCls}
              placeholder="contato@empresa.com.br"
              disabled={createUserMutation.isPending}
            />
          </div>
          <div>
            <FormLabel>Telefone / WhatsApp</FormLabel>
            <input
              type="tel"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: formatTelefone(e.target.value) })}
              className={inputCls}
              placeholder="(43) 99999-8888"
              maxLength={15}
              disabled={createUserMutation.isPending}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Tipo de Empresa</FormLabel>
            <select
              value={newUser.type}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  type: e.target.value as any,
                  slaughterLimit: e.target.value === 'terceiro' ? 10 : 20,
                })
              }
              className={inputCls}
              disabled={createUserMutation.isPending}
            >
              <option value="cooperado">Cooperada</option>
              <option value="terceiro">Terceira (Parceira)</option>
            </select>
          </div>
          <div>
            <FormLabel>Limite Abate/semana (cab)</FormLabel>
            <input
              type="number"
              min={1}
              max={999}
              value={newUser.slaughterLimit}
              onChange={(e) =>
                setNewUser({ ...newUser, slaughterLimit: Number(e.target.value.slice(0, 3)) })
              }
              className={inputCls}
              disabled={createUserMutation.isPending}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={createUserMutation.isPending}
            className={btnSecondary}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createUserMutation.isPending}
            className={btnPrimary + ' flex items-center gap-1.5'}
          >
            {createUserMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{createUserMutation.isPending ? 'Salvando no Banco...' : 'Cadastrar Empresa'}</span>
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
