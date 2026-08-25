import { useState } from 'react';
import { Search, Cake, Gift, Calendar, Download, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { useAuditLog } from '../../hooks/useAuditLog';
import { exportToCSV } from '../../hooks/useExportCSV';
import { PageHeader, Badge, inputCls, btnSecondary } from '../../components/ui';
import { EditBirthDateModal } from '../../components/modals/EditBirthDateModal';
import { useUsersQuery, useSendBirthdayGreetingMutation } from '../../hooks/useUsers';
import type { User, PushNotification } from '../../types';

export function BirthdaysPage() {
  const { user: currentUser } = useAuth();
  const { dispatch } = useAppContext();
  const { logAction } = useAuditLog();

  const { data: users = [], isLoading, isError, error, refetch, isFetching } = useUsersQuery();
  const sendBirthdayGreetingMutation = useSendBirthdayGreetingMutation();
  const [sendingUserId, setSendingUserId] = useState<string | null>(null);

  const [birthdaySearchTerm, setBirthdaySearchTerm] = useState('');
  const [birthdayMonthFilter, setBirthdayMonthFilter] = useState('todos');
  const [editingBirthDateUser, setEditingBirthDateUser] = useState<{ id: string; name: string; birthDate: string } | null>(null);

  const formatBirthDateHelper = (birthDateStr?: string) => {
    if (!birthDateStr) return 'Não cadastrado';
    if (birthDateStr.includes('-')) {
      const parts = birthDateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return birthDateStr;
  };

  const isBirthdayTodayHelper = (birthDateStr?: string) => {
    if (!birthDateStr) return false;
    const today = new Date();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    if (birthDateStr.includes('-')) {
      const parts = birthDateStr.split('-');
      return parts.length === 3 && parts[1] === m && parts[2] === d;
    }
    if (birthDateStr.includes('/')) {
      const parts = birthDateStr.split('/');
      return parts.length >= 2 && parts[0] === d && parts[1] === m;
    }
    return false;
  };

  const handleSendBirthdayMessage = (targetUser: User) => {
    setSendingUserId(targetUser.id);

    // 1. Atualiza estado em memória para compatibilidade
    const pushMsg: PushNotification = {
      id: `push-${Date.now()}`,
      title: `Feliz Aniversário, ${targetUser.name.split(' ')[0]}!`,
      message: `A diretoria e equipe da COOPERCARNE te desejam um feliz aniversário! Muita saúde, sucesso e bons negócios!`,
      targetAudience: targetUser.type === 'terceiro' ? 'terceiros' : 'cooperados',
      sentAt: new Date().toLocaleString('pt-BR'),
      sentBy: currentUser?.email || 'Administração',
      deliveredCount: 1,
    };
    dispatch({ type: 'ADD_PUSH_NOTIFICATION', payload: pushMsg });
    logAction('Notificação Aniversário', `Mensagem de feliz aniversário enviada para ${targetUser.name}`, 'USUARIOS');

    // 2. Persiste e sincroniza no Supabase (notificacoes, comunicados, audit_log)
    sendBirthdayGreetingMutation.mutate(
      { user: targetUser, adminId: currentUser?.id },
      {
        onSettled: () => setSendingUserId(null),
      }
    );
  };

  const todaysBirthdayUsers = users.filter((u) => isBirthdayTodayHelper(u.birthDate));

  const filteredBirthdayUsers = users.filter((u) => {
    const matchesSearch =
      !birthdaySearchTerm ||
      u.name.toLowerCase().includes(birthdaySearchTerm.toLowerCase()) ||
      u.phone.includes(birthdaySearchTerm) ||
      u.email.toLowerCase().includes(birthdaySearchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (birthdayMonthFilter === 'todos') return true;
    if (birthdayMonthFilter === 'hoje') return isBirthdayTodayHelper(u.birthDate);
    if (!u.birthDate) return false;
    if (u.birthDate.includes('-')) {
      const parts = u.birthDate.split('-');
      return parts.length === 3 && parts[1] === birthdayMonthFilter;
    }
    if (u.birthDate.includes('/')) {
      const parts = u.birthDate.split('/');
      return parts.length >= 2 && parts[1] === birthdayMonthFilter;
    }
    return true;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Gestão de Aniversariantes dos Cooperados"
          description="Acompanhamento das datas comemorativas, edição rápida e envio de felicitações diretamente para o app do produtor"
        />
        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou contato..."
              value={birthdaySearchTerm}
              onChange={(e) => setBirthdaySearchTerm(e.target.value)}
              className={`${inputCls} pl-8 w-56 text-xs`}
            />
          </div>
          <select
            value={birthdayMonthFilter}
            onChange={(e) => setBirthdayMonthFilter(e.target.value)}
            className="border border-gray-300 rounded px-2.5 py-2 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-[#c51d1f]"
          >
            <option value="todos">Todos os Meses</option>
            <option value="hoje">🌟 Aniversariantes de Hoje</option>
            <option value="01">Janeiro</option>
            <option value="02">Fevereiro</option>
            <option value="03">Março</option>
            <option value="04">Abril</option>
            <option value="05">Maio</option>
            <option value="06">Junho</option>
            <option value="07">Julho</option>
            <option value="08">Agosto</option>
            <option value="09">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>

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
                'aniversariantes_cooperados',
                ['Nome', 'Tipo', 'Telefone', 'Email', 'Data_Aniversario'],
                users.map((u) => [u.name, u.type, u.phone, u.email, u.birthDate || 'N/A'])
              )
            }
            className={btnSecondary + ' flex items-center gap-1.5 text-xs'}
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-16 bg-slate-100 rounded" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar aniversariantes</h3>
          <p className="text-xs text-red-700 mb-4">{error?.message}</p>
        </div>
      ) : (
        <>
          {/* CARD DE DESTAQUE DE HOJE */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-amber-100 flex items-center justify-center border border-amber-200">
                  <Cake className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Aniversariantes do Dia de Hoje</h3>
                  <p className="text-xs text-slate-500">
                    {todaysBirthdayUsers.length > 0
                      ? `${todaysBirthdayUsers.length} cooperado(s) celebrando aniversário hoje!`
                      : 'Nenhum cooperado faz aniversário no dia de hoje.'}
                  </p>
                </div>
              </div>
            </div>
            {todaysBirthdayUsers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                {todaysBirthdayUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-amber-50/60 border border-amber-200 rounded-md p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500">
                        {u.phone} • {u.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendBirthdayMessage(u)}
                      disabled={sendBirthdayGreetingMutation.isPending && sendingUserId === u.id}
                      className="bg-[#c51d1f] text-white font-medium px-3 py-1.5 rounded text-xs hover:bg-[#a01517] flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                    >
                      {sendBirthdayGreetingMutation.isPending && sendingUserId === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                      <span>Enviar Parabéns no App</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LISTA COMPLETA */}
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Lista de Cooperados & Datas de Nascimento</span>
              <span className="text-slate-400 font-normal text-[11px]">
                Exibindo {filteredBirthdayUsers.length} de {users.length} cadastros
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Cooperado / Produtor</th>
                  <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
                  <th className="text-left px-4 py-2.5 font-medium">Contato</th>
                  <th className="text-left px-4 py-2.5 font-medium">Data Nascimento</th>
                  <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredBirthdayUsers.map((u) => {
                  const formattedDate = formatBirthDateHelper(u.birthDate);
                  const isToday = isBirthdayTodayHelper(u.birthDate);
                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                        isToday ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {u.name}
                          {isToday && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                              Hoje 🎉
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{u.cpfCnpj}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.type === 'cooperado' ? 'blue' : 'purple'}>{u.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>{u.phone}</div>
                        <div className="text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        {formattedDate}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setEditingBirthDateUser({
                                id: u.id,
                                name: u.name,
                                birthDate: u.birthDate || '',
                              })
                            }
                            className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 px-2.5 py-1.5 rounded font-medium transition-colors flex items-center gap-1"
                            title="Editar Data de Nascimento"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => handleSendBirthdayMessage(u)}
                            disabled={sendBirthdayGreetingMutation.isPending && sendingUserId === u.id}
                            className="text-xs bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                          >
                            {sendBirthdayGreetingMutation.isPending && sendingUserId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Gift className="w-3.5 h-3.5" />
                            )}
                            <span>Mandar Parabéns</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredBirthdayUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 text-xs font-medium">
                      Nenhum aniversariante encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingBirthDateUser && (
        <EditBirthDateModal
          userId={editingBirthDateUser.id}
          userName={editingBirthDateUser.name}
          currentBirthDate={editingBirthDateUser.birthDate}
          onClose={() => setEditingBirthDateUser(null)}
        />
      )}
    </div>
  );
}
