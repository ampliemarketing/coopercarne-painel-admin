import { useState } from 'react';
import { toast } from 'sonner';
import { Building2, User as UserIcon, Phone, Mail, Calendar, Check, X as XIcon } from 'lucide-react';
import { ModalOverlay, ModalHeader, Badge } from '../ui';

interface PendingRequest {
  id: string;
  nome: string;
  documento: string;
  tipoVinculo: 'empresa' | 'pessoa_fisica';
  empresaNome?: string;
  telefone: string;
  email: string;
  solicitadoEm: string;
}

// Mock temporário só para demonstrar a tela visualmente.
// Será substituído pela leitura real de profiles com verificado = false quando o cadastro do app do usuário for integrado ao Supabase.
const MOCK_PENDING_REQUESTS: PendingRequest[] = [
  {
    id: 'req-1',
    nome: 'Carlos Eduardo Ferreira',
    documento: '12.345.678/0001-90',
    tipoVinculo: 'empresa',
    empresaNome: 'Supermercado Silva Ltda',
    telefone: '(43) 99911-2233',
    email: 'carlos.ferreira@email.com',
    solicitadoEm: '2026-08-24',
  },
  {
    id: 'req-2',
    nome: 'Marcos Antônio Souza',
    documento: '045.678.912-33',
    tipoVinculo: 'pessoa_fisica',
    telefone: '(43) 98877-1122',
    email: 'marcos.souza@email.com',
    solicitadoEm: '2026-08-25',
  },
];

export function PendingRequestsModal({ onClose }: { onClose: () => void }) {
  const [requests, setRequests] = useState(MOCK_PENDING_REQUESTS);

  const handleApprove = (req: PendingRequest) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast.success(`Cadastro de "${req.nome}" aprovado.`);
  };

  const handleReject = (req: PendingRequest) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast.error(`Cadastro de "${req.nome}" rejeitado.`);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Solicitações de Cadastro Pendentes" onClose={onClose} />
      <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
        {requests.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <Check className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Nenhuma solicitação pendente no momento.
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="border border-slate-200 rounded-lg p-3.5 bg-slate-50">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-semibold text-sm text-slate-900">{req.nome}</div>
                {req.tipoVinculo === 'empresa' ? (
                  <Badge variant="blue">Vínculo empresa</Badge>
                ) : (
                  <Badge variant="amber">Pessoa física</Badge>
                )}
              </div>

              {req.tipoVinculo === 'empresa' && req.empresaNome && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{req.empresaNome}</span>
                </div>
              )}

              <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{req.documento}</span>
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{req.telefone}</span>
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{req.email}</span>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-3">
                <Calendar className="w-3 h-3" />
                <span>Solicitado em {req.solicitadoEm.split('-').reverse().join('/')}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(req)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Aprovar
                </button>
                <button
                  onClick={() => handleReject(req)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                >
                  <XIcon className="w-3.5 h-3.5" /> Rejeitar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </ModalOverlay>
  );
}
