import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Send,
  Paperclip,
  FileText,
  AlertCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  X,
} from 'lucide-react';
import { PageHeader, Badge, inputCls, btnPrimary } from '../../components/ui';
import { useAuth } from '../../store/AuthContext';
import {
  useTicketsQuery,
  useSendTicketMessageMutation,
  useUpdateTicketStatusMutation,
  useUploadAttachmentMutation,
} from '../../hooks/useTickets';
import type { Ticket } from '../../types';

export function ChamadosPage() {
  const { user: authUser } = useAuth();
  const { data: tickets = [], isLoading, isError, error, refetch, isFetching } = useTicketsQuery();

  const sendMessageMutation = useSendTicketMessageMutation();
  const updateStatusMutation = useUpdateTicketStatusMutation();
  const uploadAttachmentMutation = useUploadAttachmentMutation();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aberto' | 'em_atendimento' | 'resolvido'>('todos');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chamado selecionado
  const activeTicket: Ticket | undefined = selectedTicketId
    ? tickets.find((t) => t.id === selectedTicketId)
    : undefined;

  // Auto-scroll ao final das mensagens quando o chamado selecionado ou suas mensagens mudarem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages?.length, activeTicket?.id]);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      !ticketSearch ||
      t.userName.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.code.toLowerCase().includes(ticketSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'todos') return true;
    return t.status === statusFilter;
  });

  const handleSendMessage = () => {
    if (!adminReplyText.trim() || !activeTicket) return;
    const currentText = adminReplyText.trim();
    setAdminReplyText('');

    sendMessageMutation.mutate({
      chamadoId: activeTicket.id,
      text: currentText,
      senderId: authUser?.id || 'admin',
      senderTipo: 'admin',
    });
  };

  const handleStatusChange = (newStatus: 'aberto' | 'em_atendimento' | 'resolvido') => {
    if (!activeTicket) return;
    updateStatusMutation.mutate({
      chamadoId: activeTicket.id,
      newStatus,
      adminId: authUser?.id,
      ticketCode: activeTicket.code,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeTicket) return;
    const file = files[0];

    uploadAttachmentMutation.mutate({
      chamadoId: activeTicket.id,
      file,
      uploaderId: authUser?.id || 'admin',
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const countAbertos = tickets.filter((t) => t.status === 'aberto').length;
  const countEmAtendimento = tickets.filter((t) => t.status === 'em_atendimento').length;
  const countResolvidos = tickets.filter((t) => t.status === 'resolvido').length;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Central de Atendimento & Chamados"
          description="Gestão em tempo real das mensagens, anexos e dúvidas enviadas pelos produtores pelo App"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors shadow-sm disabled:opacity-50"
            title="Atualizar chamados"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#c51d1f]' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="h-96 bg-slate-100 rounded" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar central de chamados</h3>
          <p className="text-xs text-red-700 mb-4">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-4 py-2 rounded shadow-sm"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-[660px]">
          {/* Coluna Esquerda: Lista de Chamados */}
          <div className="border-r border-slate-200 flex flex-col bg-slate-50/50">
            {/* Abas de Filtro de Status */}
            <div className="p-2.5 border-b border-slate-200 bg-white grid grid-cols-4 gap-1 text-[11px] font-bold text-center">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`py-1.5 rounded transition-colors ${
                  statusFilter === 'todos'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({tickets.length})
              </button>
              <button
                onClick={() => setStatusFilter('aberto')}
                className={`py-1.5 rounded transition-colors ${
                  statusFilter === 'aberto'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Abertos ({countAbertos})
              </button>
              <button
                onClick={() => setStatusFilter('em_atendimento')}
                className={`py-1.5 rounded transition-colors ${
                  statusFilter === 'em_atendimento'
                    ? 'bg-blue-700 text-white'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                Em Andam. ({countEmAtendimento})
              </button>
              <button
                onClick={() => setStatusFilter('resolvido')}
                className={`py-1.5 rounded transition-colors ${
                  statusFilter === 'resolvido'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Resolvidos ({countResolvidos})
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por código, usuário ou assunto..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className={inputCls + ' pl-8 text-xs'}
                />
              </div>
            </div>

            {/* Lista com scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredTickets.map((ticket) => {
                const isSelected = ticket.id === (activeTicket?.id ?? '');
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-100 border-l-4 border-[#c51d1f]'
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-200 px-1 py-0.5 rounded">
                          {ticket.code}
                        </span>
                        <span className="font-bold text-xs text-slate-900 truncate max-w-[120px]">
                          {ticket.userName}
                        </span>
                      </div>
                      <Badge variant={ticket.userType === 'cooperado' ? 'blue' : 'purple'}>
                        {ticket.userType}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span
                        className={`font-semibold capitalize ${
                          ticket.status === 'aberto'
                            ? 'text-amber-700'
                            : ticket.status === 'em_atendimento'
                            ? 'text-blue-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        ● {ticket.status.replace('_', ' ')}
                      </span>
                      <span>{ticket.updatedAt}</span>
                    </div>
                  </div>
                );
              })}

              {filteredTickets.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Nenhum chamado encontrado com os filtros selecionados.
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Conversa Interativa */}
          {activeTicket ? (
            <div className="col-span-2 flex flex-col h-full bg-white">
              {/* Header do Chamado Selecionado */}
              <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#c51d1f] bg-red-50 px-1.5 py-0.5 rounded">
                      {activeTicket.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 truncate">{activeTicket.subject}</h3>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {activeTicket.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {activeTicket.userName} ({activeTicket.userType}) • {new Date(activeTicket.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    disabled={updateStatusMutation.isPending}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer outline-none transition-colors ${
                      activeTicket.status === 'resolvido'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : activeTicket.status === 'em_atendimento'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <option value="aberto">Aberto</option>
                    <option value="em_atendimento">Em Atendimento</option>
                    <option value="resolvido">Resolvido</option>
                  </select>

                  <button
                    onClick={() => setSelectedTicketId(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Seção de Anexos do Chamado */}
              {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                <div className="px-5 py-2 bg-amber-50/50 border-b border-amber-100 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" /> Anexos ({activeTicket.attachments.length}):
                  </span>
                  {activeTicket.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] bg-white border border-amber-200 text-slate-800 hover:text-[#c51d1f] hover:border-[#c51d1f] px-2 py-0.5 rounded font-medium transition-colors shadow-xs"
                      title={`Baixar ${att.fileName}`}
                    >
                      <FileText className="w-3 h-3 text-slate-500" />
                      <span className="max-w-[120px] truncate">{att.fileName}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  ))}
                </div>
              )}

              {/* Histórico de Mensagens */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                {activeTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2.5 shadow-sm text-xs ${
                        msg.sender === 'admin'
                          ? 'bg-slate-900 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span
                          className={`font-bold text-[10px] uppercase ${
                            msg.sender === 'admin' ? 'text-red-300' : 'text-slate-500'
                          }`}
                        >
                          {msg.sender === 'admin' ? 'Atendimento COOPERCARNE' : activeTicket.userName}
                        </span>
                        <span
                          className={`text-[10px] ${
                            msg.sender === 'admin' ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Caixa de Envio de Resposta e Upload de Anexos */}
              <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAttachmentMutation.isPending}
                  className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
                  title="Anexar arquivo ou foto ao chamado"
                >
                  {uploadAttachmentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#c51d1f]" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="text"
                  placeholder="Digite sua resposta oficial ao cooperado..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#c51d1f]"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || !adminReplyText.trim()}
                  className={btnPrimary + ' text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50'}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Enviar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="col-span-2 flex items-center justify-center h-full text-slate-400 text-xs font-medium">
              Selecione um chamado na lista lateral para iniciar o atendimento.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
