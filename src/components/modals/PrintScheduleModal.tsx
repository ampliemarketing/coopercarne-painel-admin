import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { ModalOverlay, ModalHeader, btnPrimary, btnSecondary } from '../ui';
import type { SlaughterSchedule } from '../../types';

export function PrintScheduleModal({ schedule, onClose }: { schedule: SlaughterSchedule; onClose: () => void }) {
  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Guia de Abate & Ordem de Curral" onClose={onClose} />
      <div className="p-5 text-sm space-y-3 font-mono border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center gap-2.5 border-b border-gray-300 pb-2">
          <img src="/logo.png" alt="COOPERCARNE" className="h-7 w-auto object-contain" />
          <span className="font-bold text-base text-gray-900 font-sans">COOPERCARNE FRIGORÍFICO</span>
        </div>
        <div className="flex justify-between"><span>LOTE:</span><span className="font-bold">{schedule.id}</span></div>
        <div className="flex justify-between"><span>PRODUTOR:</span><span className="font-bold">{schedule.userName}</span></div>
        <div className="flex justify-between"><span>ESPÉCIE:</span><span className="font-bold uppercase">{schedule.animalType} ({schedule.quantity} un)</span></div>
        <div className="flex justify-between"><span>GTA SANITÁRIA:</span><span className="font-bold">{schedule.gtaNumber || '88412-PR'}</span></div>
        <div className="flex justify-between"><span>DATA ABATE:</span><span className="font-bold">{schedule.slaughterDate}</span></div>
        <div className="flex justify-between"><span>TAXA TOTAL:</span><span className="font-bold">R$ {schedule.totalFee}</span></div>
      </div>
      <div className="p-4 flex justify-end gap-2 bg-white">
        <button onClick={onClose} className={btnSecondary}>Fechar</button>
        <button onClick={() => { window.print(); toast.success('Enviado para impressora!'); }} className={btnPrimary + ' flex items-center gap-1'}>
          <Printer className="w-4 h-4" /> Imprimir Agora
        </button>
      </div>
    </ModalOverlay>
  );
}
