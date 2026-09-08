import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ModalOverlay, ModalHeader, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { SIDEBAR_ITEMS } from '../../constants';
import type { AdminRole } from '../../types';
import type { SystemUser } from '../../features/systemUsers/SystemUsersPage';

const formatCpf = (v: string) => {
  const digits = v.replace(/\D/g, '').slice(0, 11);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const PERFIL_LABEL: Record<AdminRole, string> = {
  admin: 'Administrador',
  operador_camara: 'Operador de Câmara Fria',
};

export function EditSystemUserModal({
  systemUser,
  onClose,
}: {
  systemUser: SystemUser;
  onClose: () => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [form, setForm] = useState({
    nome: systemUser.nome,
    cpf: systemUser.cpf,
    email: systemUser.email,
    novaSenha: '',
    perfil: systemUser.perfil,
  });

  const acessosPermitidos = SIDEBAR_ITEMS.filter((item) => item.roles.includes(form.perfil));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome.trim() || !form.cpf.trim() || !form.email.trim()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    if (form.novaSenha && form.novaSenha.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    // Visual apenas — ainda não grava no banco.
    setIsPending(true);
    setTimeout(() => {
      toast.success(`Cadastro de "${form.nome}" atualizado (visual — ainda não integrado ao banco).`);
      setIsPending(false);
      onClose();
    }, 600);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title={`Editar Cadastro — ${systemUser.nome}`} onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div>
          <FormLabel>Nome Completo *</FormLabel>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className={inputCls}
            required
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>CPF *</FormLabel>
            <input
              type="text"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })}
              className={inputCls}
              required
              disabled={isPending}
            />
          </div>
          <div>
            <FormLabel>E-mail *</FormLabel>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
              required
              disabled={isPending}
            />
          </div>
        </div>

        <div>
          <FormLabel>Nova Senha</FormLabel>
          <input
            type="password"
            value={form.novaSenha}
            onChange={(e) => setForm({ ...form, novaSenha: e.target.value })}
            className={inputCls}
            placeholder="Deixe em branco para manter a senha atual"
            disabled={isPending}
          />
        </div>

        <div>
          <FormLabel>Perfil de Acesso (Permissões) *</FormLabel>
          <select
            value={form.perfil}
            onChange={(e) => setForm({ ...form, perfil: e.target.value as AdminRole })}
            className={inputCls}
            disabled={isPending}
          >
            <option value="operador_camara">Operador de Câmara Fria</option>
            <option value="admin">Administrador (acesso total)</option>
          </select>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">
            Seções liberadas para {PERFIL_LABEL[form.perfil]}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {acessosPermitidos.map((item) => (
              <div key={item.key} className="flex items-center gap-1.5 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" onClick={onClose} disabled={isPending} className={btnSecondary}>
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className={btnPrimary + ' flex items-center gap-1.5'}>
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
