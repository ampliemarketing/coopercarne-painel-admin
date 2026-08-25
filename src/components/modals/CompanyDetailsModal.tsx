import { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Hash,
  Users,
  ClipboardList,
  Info,
  Pencil,
  Loader2,
} from 'lucide-react';
import { ModalOverlay, ModalHeader, Badge, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { useSchedulesQuery } from '../../hooks/useSchedules';
import { useUpdateUserDetailsMutation } from '../../hooks/useUsers';
import type { User } from '../../types';

type Tab = 'dados' | 'usuarios' | 'historico';

interface VinculoUsuario {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  status: 'ativo' | 'pendente';
}

// Mock temporário — o modelo atual ainda não suporta múltiplos logins por CNPJ.
// Será substituído pela leitura real de profiles vinculados a este estabelecimento_id.
function getMockVinculos(user: User): VinculoUsuario[] {
  return [
    { id: 'u-1', nome: user.name, cargo: 'Gerente / Responsável', email: user.email, status: 'ativo' },
    { id: 'u-2', nome: 'Financeiro da Empresa', cargo: 'Financeiro', email: `financeiro@${user.email.split('@')[1] || 'empresa.com.br'}`, status: 'pendente' },
  ];
}

const statusBadge: Record<string, { variant: 'green' | 'amber' | 'red' | 'gray'; label: string }> = {
  pendente_aprovacao: { variant: 'amber', label: 'Pendente' },
  aprovado: { variant: 'green', label: 'Aprovado' },
  rejeitado: { variant: 'red', label: 'Rejeitado' },
  concluido: { variant: 'gray', label: 'Concluído' },
};

const formatCnpj = (v: string) => {
  const digits = v.replace(/\D/g, '').slice(0, 14);
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const formatTelefone = (v: string) => {
  const digits = v.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export function CompanyDetailsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('dados');
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState(user);
  const [form, setForm] = useState({
    name: user.name,
    cpfCnpj: user.cpfCnpj,
    phone: user.phone,
    email: user.email,
  });

  const { data: schedules = [], isLoading: isLoadingSchedules } = useSchedulesQuery();
  const updateDetailsMutation = useUpdateUserDetailsMutation();

  const companySchedules = schedules
    .filter((s) => s.userId === current.id)
    .sort((a, b) => (a.slaughterDate < b.slaughterDate ? 1 : -1));

  const vinculos = getMockVinculos(current);

  const tabs: { id: Tab; label: string; icon: typeof Info }[] = [
    { id: 'dados', label: 'Dados da Empresa', icon: Info },
    { id: 'usuarios', label: 'Usuários Vinculados', icon: Users },
    { id: 'historico', label: 'Histórico de Agendamentos', icon: ClipboardList },
  ];

  const handleStartEdit = () => {
    setForm({ name: current.name, cpfCnpj: current.cpfCnpj, phone: current.phone, email: current.email });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.cpfCnpj.trim()) return;

    updateDetailsMutation.mutate(
      {
        userId: current.id,
        estabelecimentoId: current.estabelecimentoId,
        data: {
          name: form.name.trim(),
          cpfCnpj: form.cpfCnpj.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        },
      },
      {
        onSuccess: () => {
          setCurrent((prev) => ({ ...prev, ...form }));
          setIsEditing(false);
        },
      }
    );
  };

  return (
    <ModalOverlay onClose={onClose} maxWidthClass="max-w-4xl">
      <ModalHeader title={`Detalhes — ${current.name}`} onClose={onClose} />

      {/* Abas horizontais */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold uppercase tracking-wide transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-[#c51d1f] text-[#c51d1f] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-6 max-h-[75vh] overflow-y-auto">
        {/* Dados da Empresa */}
        {tab === 'dados' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                {isEditing ? (
                  <span className="font-bold text-slate-900">Editando dados da empresa</span>
                ) : (
                  <span className="font-bold text-slate-900">{current.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={current.type === 'cooperado' ? 'blue' : 'purple'}>{current.type}</Badge>
                {!isEditing && (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <FormLabel>Razão Social *</FormLabel>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                    disabled={updateDetailsMutation.isPending}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel>CNPJ *</FormLabel>
                    <input
                      type="text"
                      value={form.cpfCnpj}
                      onChange={(e) => setForm({ ...form, cpfCnpj: formatCnpj(e.target.value) })}
                      className={inputCls}
                      disabled={updateDetailsMutation.isPending}
                    />
                  </div>
                  <div>
                    <FormLabel>Telefone / WhatsApp</FormLabel>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: formatTelefone(e.target.value) })}
                      className={inputCls}
                      maxLength={15}
                      disabled={updateDetailsMutation.isPending}
                    />
                  </div>
                </div>
                <div>
                  <FormLabel>E-mail de Contato</FormLabel>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls}
                    disabled={updateDetailsMutation.isPending}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={updateDetailsMutation.isPending}
                    className={btnSecondary}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={updateDetailsMutation.isPending}
                    className={btnPrimary + ' flex items-center gap-1.5'}
                  >
                    {updateDetailsMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{updateDetailsMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">CNPJ</p>
                  <p className="font-mono font-semibold text-slate-800 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    {current.cpfCnpj}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Status</p>
                  {current.status === 'blocked' ? (
                    <Badge variant="red">Bloqueado</Badge>
                  ) : (
                    <Badge variant="green">Ativo</Badge>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Telefone</p>
                  <p className="text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {current.phone}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">E-mail</p>
                  <p className="text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {current.email}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Cidade / Estado</p>
                  <p className="text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {current.notes || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Cadastrada em</p>
                  <p className="text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {current.createdAt.split('-').reverse().join('/')}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Limite Abate/semana</p>
                  <p className="font-bold text-slate-900">{current.slaughterLimit} cab</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usuários Vinculados */}
        {tab === 'usuarios' && (
          <div className="space-y-2.5">
            {vinculos.map((v) => (
              <div key={v.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{v.nome}</p>
                  <p className="text-xs text-slate-500">{v.cargo}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{v.email}</p>
                </div>
                {v.status === 'ativo' ? (
                  <Badge variant="green">Ativo</Badge>
                ) : (
                  <Badge variant="amber">Pendente</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Histórico de Agendamentos */}
        {tab === 'historico' && (
          <div className="space-y-2.5">
            {isLoadingSchedules ? (
              <div className="text-center py-10 text-slate-400 text-xs">Carregando histórico...</div>
            ) : companySchedules.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Nenhum agendamento encontrado para esta empresa.
              </div>
            ) : (
              companySchedules.map((s) => {
                const badge = s.status ? statusBadge[s.status] : undefined;
                return (
                  <div key={s.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-900 capitalize">
                        {s.animalType} — {s.quantity} cab
                      </span>
                      {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Abate em {s.slaughterDate.split('-').reverse().join('/')}
                      </span>
                      <span className="font-semibold text-slate-700">
                        R$ {s.totalFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
