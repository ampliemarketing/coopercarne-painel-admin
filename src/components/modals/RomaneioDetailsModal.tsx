import { useState } from 'react';
import { Paperclip, Upload, FileText, Calendar, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { ModalOverlay, ModalHeader, Badge, btnSecondary, btnPrimary } from '../ui';
import type { SlaughterSchedule } from '../../types';

export function RomaneioDetailsModal({
  schedule,
  anexoAtual,
  observacaoAtual,
  onClose,
  onAnexoEnviado,
}: {
  schedule: SlaughterSchedule;
  anexoAtual?: string;
  observacaoAtual?: string;
  onClose: () => void;
  onAnexoEnviado: (scheduleId: string, nomeArquivo: string, observacao?: string) => void;
}) {
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [observacao, setObservacao] = useState(observacaoAtual ?? '');

  const handleSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArquivoSelecionado(e.target.files?.[0] || null);
  };

  const handleEnviarAnexo = () => {
    if (!arquivoSelecionado) return;
    // Visual apenas — envio real ao Storage ainda será conectado.
    onAnexoEnviado(schedule.id, arquivoSelecionado.name, observacao.trim() || undefined);
    toast.success(`Romaneio "${arquivoSelecionado.name}" pronto para envio (visual — ainda não integrado ao banco).`);
    setArquivoSelecionado(null);
  };

  return (
    <ModalOverlay onClose={onClose} maxWidthClass="max-w-lg">
      <ModalHeader title={`Romaneio — ${schedule.userName}`} onClose={onClose} />
      <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-900">{schedule.userName}</span>
          </div>
          <Badge variant={schedule.userType === 'cooperado' ? 'blue' : 'purple'}>{schedule.userType}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Espécie</p>
            <p className="font-semibold text-slate-800 capitalize">{schedule.animalType}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Data do Abate</p>
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {schedule.slaughterDate.split('-').reverse().join('/')}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Agendado</p>
            <p className="font-semibold text-slate-800">
              {schedule.quantity} cab.
              {schedule.machos !== undefined && schedule.femeas !== undefined && (
                <span className="text-[11px] text-slate-500 font-normal block">
                  {schedule.machos} machos · {schedule.femeas} fêmeas
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Recebido</p>
            <p className="font-semibold text-blue-700">{schedule.quantidadeRecebida ?? '-'} cab.</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Condenação</p>
            <p className="font-semibold text-red-700">{schedule.quantidadePerda ?? 0} cab.</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">Processado (Final)</p>
            <p className="font-bold text-emerald-700">{schedule.quantidadeProcessada ?? '-'} cab.</p>
          </div>
        </div>

        {/* Comprovante / Anexo */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-[#c51d1f]" />
            Romaneio / Documento Anexo
          </h4>
          <p className="text-[11px] text-slate-500 -mt-1.5">
            Fica visível para o cooperado/terceiro no histórico de agendamentos do aplicativo.
          </p>

          {anexoAtual && (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 w-fit">
              <FileText className="w-3.5 h-3.5" /> {anexoAtual}
            </div>
          )}

          {observacaoAtual && (
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              {observacaoAtual}
            </p>
          )}

          <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-300 hover:border-[#c51d1f] rounded-lg py-5 cursor-pointer transition-colors bg-slate-50/50">
            <Upload className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 px-4 text-center">
              {arquivoSelecionado ? arquivoSelecionado.name : 'Clique para selecionar um arquivo (PDF ou imagem)'}
            </span>
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleSelecionarArquivo} />
          </label>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Observação (opcional)
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Alguma observação sobre esse romaneio/anexo..."
              rows={2}
              className="mt-1 w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c51d1f]/30 focus:border-[#c51d1f] resize-none"
            />
          </div>

          {arquivoSelecionado && (
            <button
              type="button"
              onClick={handleEnviarAnexo}
              className={btnPrimary + ' flex items-center gap-1.5 text-xs w-fit'}
            >
              <Upload className="w-3.5 h-3.5" /> Enviar Anexo
            </button>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-200">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Fechar
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
