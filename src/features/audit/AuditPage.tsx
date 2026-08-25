import { useState } from 'react';
import { Search, RefreshCw, AlertCircle, ShieldCheck, Download } from 'lucide-react';
import { PageHeader, Badge, inputCls, btnSecondary } from '../../components/ui';
import { useAuditLogsQuery } from '../../hooks/useAudit';
import { exportToCSV } from '../../hooks/useExportCSV';

export function AuditPage() {
  const { data: auditLogs = [], isLoading, isError, error, refetch, isFetching } = useAuditLogsQuery(200);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (categoryFilter === 'todos') return true;
    return log.category === categoryFilter;
  });

  const getCategoryVariant = (cat: string) => {
    switch (cat) {
      case 'OPERACIONAL':
        return 'blue';
      case 'USUARIOS':
        return 'purple';
      case 'CAMARA_FRIA':
        return 'amber';
      default:
        return 'gray';
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Logs de Auditoria & Trilha de Segurança"
          description="Registro cronológico e imutável de todas as modificações operacionais e administrativas no Supabase"
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar em ações ou emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputCls + ' pl-8 w-56 text-xs'}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded px-2.5 py-2 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-[#c51d1f]"
          >
            <option value="todos">Todas Categorias</option>
            <option value="OPERACIONAL">Operacional</option>
            <option value="USUARIOS">Usuários</option>
            <option value="CAMARA_FRIA">Câmara Fria</option>
            <option value="SISTEMA">Sistema</option>
          </select>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors shadow-sm disabled:opacity-50"
            title="Atualizar logs de auditoria"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#c51d1f]' : ''}`} />
          </button>
          <button
            onClick={() =>
              exportToCSV(
                'audit_logs_coopercarne',
                ['Data_Hora', 'Operador', 'Cargo', 'Categoria', 'Acao', 'Detalhes'],
                auditLogs.map((l) => [l.timestamp, l.userEmail, l.userRole, l.category, l.action, l.details])
              )
            }
            className={btnSecondary + ' flex items-center gap-1.5 text-xs'}
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-md p-8 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-100 rounded" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar trilha de auditoria</h3>
          <p className="text-xs text-red-700 mb-4">{error?.message}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Registros de Auditoria ({filteredLogs.length})
            </span>
            <span className="text-slate-400 text-[11px]">Ordenados por ocorrência mais recente</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Data / Hora</th>
                <th className="text-left px-4 py-2.5 font-medium">Operador / Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Categoria</th>
                <th className="text-left px-4 py-2.5 font-medium">Ação Realizada</th>
                <th className="text-left px-4 py-2.5 font-medium">Detalhes da Transação</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800 text-xs block">{log.userEmail}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">{log.userRole}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getCategoryVariant(log.category)}>{log.category}</Badge>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 text-xs">{log.action}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono text-[11px]">{log.details}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400 text-xs font-medium">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
