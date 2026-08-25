import { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Download,
  RefreshCw,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Building2,
  Phone,
  Calendar,
} from 'lucide-react';
import { exportToCSV } from '../../hooks/useExportCSV';
import { PageHeader, Badge, inputCls, btnPrimary, btnSecondary } from '../../components/ui';
import { AddUserModal } from '../../components/modals/AddUserModal';
import { useUsersQuery, useToggleUserStatusMutation, useUpdateUserLimitMutation } from '../../hooks/useUsers';
import type { User } from '../../types';

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cooperado' | 'terceiro'>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // React Query Hook para leitura dos dados reais do Supabase
  const { data: users = [], isLoading, isError, error, refetch, isFetching } = useUsersQuery();

  // Mutations para atualização de status e limite no banco
  const toggleStatusMutation = useToggleUserStatusMutation();
  const updateLimitMutation = useUpdateUserLimitMutation();

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.cpfCnpj.includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.notes && u.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'all' || u.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [users, searchTerm, typeFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const handleToggleBlock = (user: User) => {
    toggleStatusMutation.mutate({
      userId: user.id,
      currentStatus: user.status,
      userName: user.name,
    });
  };

  const handleUpdateLimit = (userId: string, currentLimit: number, newLimitVal: number) => {
    if (isNaN(newLimitVal) || newLimitVal === currentLimit || newLimitVal < 0) return;
    updateLimitMutation.mutate({
      userId,
      newLimit: newLimitVal,
    });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Cooperados & Terceiros"
          description="Gestão de cadastro, limitação individual de abate e sincronização em tempo real via Supabase"
        />
        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ, cidade..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={`${inputCls} pl-8 w-64 text-xs`}
            />
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors shadow-sm disabled:opacity-50"
            title="Atualizar lista do Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#c51d1f]' : ''}`} />
          </button>

          <button
            onClick={() =>
              exportToCSV(
                'cooperados_terceiros',
                ['ID', 'Nome', 'CPF_CNPJ', 'Tipo', 'Limite_Abate', 'Status', 'Telefone', 'Email', 'Cidade_Estado', 'Data_Cadastro'],
                users.map((u) => [u.id, u.name, u.cpfCnpj, u.type, u.slaughterLimit, u.status, u.phone, u.email, u.notes || '', u.createdAt])
              )
            }
            className={btnSecondary + ' flex items-center gap-1.5 text-xs'}
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>

          <button
            onClick={() => setIsAddUserOpen(true)}
            className={btnPrimary + ' flex items-center gap-1.5 text-xs'}
          >
            <UserPlus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>
      </div>

      {/* Banner Informativo de Acesso e Credenciais */}
      <div className="mb-5 p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Padrão de Autenticação dos Cooperados
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Login: <span className="text-white font-mono font-medium">[CNPJ]</span> ou <span className="text-white font-mono font-medium">[cnpj]@email.com</span> • Senha padrão: <span className="text-amber-400 font-mono font-bold">Coopercarne123@</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-medium">
            Total Carregado: <strong className="text-white">{users.length}</strong> produtores
          </span>
        </div>
      </div>

      {/* Loading State com Skeletons */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="space-y-1.5 w-1/3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-1/6" />
                <div className="h-5 bg-slate-200 rounded w-16" />
                <div className="h-6 bg-slate-200 rounded w-20" />
                <div className="h-7 bg-slate-200 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar cooperados e terceiros</h3>
          <p className="text-xs text-red-700 mb-4 max-w-md mx-auto">
            {error?.message || 'Ocorreu uma falha na consulta ao banco de dados do Supabase.'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
          {/* Header da Tabela com Filtros e Contadores */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-[#c51d1f] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Todos ({users.length})
              </button>
              <button
                onClick={() => {
                  setTypeFilter('cooperado');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-colors ${
                  typeFilter === 'cooperado'
                    ? 'bg-[#c51d1f] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Cooperados ({users.filter((u) => u.type === 'cooperado').length})
              </button>
              <button
                onClick={() => {
                  setTypeFilter('terceiro');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-colors ${
                  typeFilter === 'terceiro'
                    ? 'bg-[#c51d1f] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Terceiros ({users.filter((u) => u.type === 'terceiro').length})
              </button>
            </div>

            <div className="text-slate-500 font-medium text-[11px]">
              Exibindo <strong className="text-slate-900">{filteredUsers.length}</strong> registros
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Nome / Razão Social</th>
                  <th className="text-left px-4 py-2.5 font-medium">CNPJ / Login</th>
                  <th className="text-left px-4 py-2.5 font-medium">Contato & Local</th>
                  <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
                  <th className="text-left px-4 py-2.5 font-medium">Limite Abate</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{user.name}</span>
                      </div>
                      {user.birthDate && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          <span>Nascimento: {user.birthDate.split('-').reverse().join('/')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono font-semibold text-slate-800">{user.cpfCnpj}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-700 flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{user.phone}</span>
                      </div>
                      {user.notes && (
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]" title={user.notes}>
                          {user.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.type === 'cooperado' ? 'blue' : 'purple'}>{user.type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          defaultValue={user.slaughterLimit}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-xs text-center font-bold text-slate-900 focus:outline-none focus:border-[#c51d1f]"
                          onBlur={(e) =>
                            handleUpdateLimit(user.id, user.slaughterLimit, Number(e.target.value))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                        />
                        <span className="text-xs text-gray-400">cab/mês</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.status === 'blocked' ? (
                        <Badge variant="red">Bloqueado</Badge>
                      ) : (
                        <Badge variant="green">Ativo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleBlock(user)}
                        disabled={toggleStatusMutation.isPending}
                        className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors disabled:opacity-50 ${
                          user.status === 'blocked'
                            ? 'border-green-300 text-green-700 hover:bg-green-50'
                            : 'border-red-300 text-red-700 hover:bg-red-50'
                        }`}
                      >
                        {user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Nenhum usuário encontrado para "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Página <strong className="text-slate-800">{currentPage}</strong> de{' '}
                <strong className="text-slate-800">{totalPages}</strong> ({filteredUsers.length} cooperados)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1 font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1 font-semibold"
                >
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isAddUserOpen && <AddUserModal onClose={() => setIsAddUserOpen(false)} />}
    </div>
  );
}

