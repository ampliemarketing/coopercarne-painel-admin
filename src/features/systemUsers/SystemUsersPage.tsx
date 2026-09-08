import { useState } from 'react';
import { UserCog, ShieldCheck, Search } from 'lucide-react';
import { PageHeader, Badge, inputCls, btnPrimary } from '../../components/ui';
import { AddSystemUserModal } from '../../components/modals/AddSystemUserModal';
import { EditSystemUserModal } from '../../components/modals/EditSystemUserModal';
import type { AdminRole } from '../../types';

export interface SystemUser {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  perfil: AdminRole;
  status: 'active' | 'blocked';
  createdAt: string;
}

// Mock temporário — só visual por enquanto. Quando integrar, isso vira uma
// consulta em profiles filtrando perfil IN ('admin', 'operador_camara').
const MOCK_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'su-1',
    nome: 'Administrador Coopercarne',
    cpf: '000.000.000-00',
    email: 'admin@coopercarne.com.br',
    perfil: 'admin',
    status: 'active',
    createdAt: '2026-08-19',
  },
  {
    id: 'su-2',
    nome: 'Marcos Vinícius Souza',
    cpf: '123.456.789-00',
    email: 'marcos.souza@coopercarne.com.br',
    perfil: 'operador_camara',
    status: 'active',
    createdAt: '2026-08-22',
  },
  {
    id: 'su-3',
    nome: 'Fernanda Lima Andrade',
    cpf: '987.654.321-00',
    email: 'fernanda.lima@coopercarne.com.br',
    perfil: 'operador_camara',
    status: 'blocked',
    createdAt: '2026-08-25',
  },
];

const PERFIL_LABEL: Record<AdminRole, string> = {
  admin: 'Administrador',
  operador_camara: 'Operador de Câmara Fria',
};

export function SystemUsersPage() {
  const [users, setUsers] = useState<SystemUser[]>(MOCK_SYSTEM_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cpf.includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = (user: SystemUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: u.status === 'blocked' ? 'active' : 'blocked' } : u))
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Usuários do Sistema"
          description="Cadastro de funcionários com acesso ao painel administrativo e suas permissões"
        />
        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputCls} pl-8 w-64 text-xs`}
            />
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className={btnPrimary + ' flex items-center gap-1.5 text-xs'}
          >
            <UserCog className="w-4 h-4" /> Novo Usuário do Sistema
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Nome</th>
                <th className="text-left px-4 py-2.5 font-medium">CPF</th>
                <th className="text-left px-4 py-2.5 font-medium">E-mail</th>
                <th className="text-left px-4 py-2.5 font-medium">Perfil de Acesso</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <UserCog className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {user.nome}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-semibold text-slate-800">{user.cpf}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600 font-mono">{user.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.perfil === 'admin' ? 'red' : 'blue'}>
                      <span className="flex items-center gap-1">
                        {user.perfil === 'admin' && <ShieldCheck className="w-3 h-3" />}
                        {PERFIL_LABEL[user.perfil]}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.status === 'blocked' ? (
                      <Badge variant="red">Desativado</Badge>
                    ) : (
                      <Badge variant="green">Ativo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-xs font-semibold px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Alterar Cadastro
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors ${
                          user.status === 'blocked'
                            ? 'border-green-300 text-green-700 hover:bg-green-50'
                            : 'border-red-300 text-red-700 hover:bg-red-50'
                        }`}
                      >
                        {user.status === 'blocked' ? 'Ativar' : 'Desativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    <UserCog className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Nenhum usuário encontrado para "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Total de usuários do sistema: <strong className="text-slate-600">{users.length}</strong>
      </p>

      {isAddOpen && <AddSystemUserModal onClose={() => setIsAddOpen(false)} />}
      {editingUser && <EditSystemUserModal systemUser={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}
