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
    birthDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.cpfCnpj.trim()) {
      toast.error('Preencha os campos obrigatórios (Nome e Documento).');
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
        birthDate: newUser.birthDate || undefined,
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
      <ModalHeader title="Cadastrar Usuário no Supabase" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div>
          <FormLabel>Nome / Razão Social *</FormLabel>
          <input
            type="text"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className={inputCls}
            placeholder="Ex: Fazenda Santa Maria / Frigorífico Central"
            required
            disabled={createUserMutation.isPending}
          />
        </div>

        <div>
          <FormLabel>CPF / CNPJ *</FormLabel>
          <input
            type="text"
            value={newUser.cpfCnpj}
            onChange={(e) => setNewUser({ ...newUser, cpfCnpj: e.target.value })}
            className={inputCls}
            placeholder="00.000.000/0001-00 ou 000.000.000-00"
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
              placeholder="produtor@coopercarne.com.br"
              disabled={createUserMutation.isPending}
            />
          </div>
          <div>
            <FormLabel>Telefone / WhatsApp</FormLabel>
            <input
              type="tel"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              className={inputCls}
              placeholder="(43) 99999-8888"
              disabled={createUserMutation.isPending}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Tipo de Produtor</FormLabel>
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
              <option value="cooperado">Cooperado</option>
              <option value="terceiro">Terceiro (Parceiro)</option>
            </select>
          </div>
          <div>
            <FormLabel>Limite Abate/mês (cab)</FormLabel>
            <input
              type="number"
              min={1}
              value={newUser.slaughterLimit}
              onChange={(e) =>
                setNewUser({ ...newUser, slaughterLimit: Number(e.target.value) })
              }
              className={inputCls}
              disabled={createUserMutation.isPending}
            />
          </div>
        </div>

        <div>
          <FormLabel>Data de Aniversário</FormLabel>
          <input
            type="date"
            value={newUser.birthDate}
            onChange={(e) => setNewUser({ ...newUser, birthDate: e.target.value })}
            className={inputCls}
            disabled={createUserMutation.isPending}
          />
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
            <span>{createUserMutation.isPending ? 'Salvando no Banco...' : 'Cadastrar Usuário'}</span>
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
