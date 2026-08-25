import React from 'react';
import { X } from 'lucide-react';

export function ModalOverlay({
  children,
  onClose,
  maxWidthClass = 'max-w-md',
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidthClass?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
      <div className={`bg-white border border-slate-200 rounded-md w-full ${maxWidthClass} shadow-xl`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
    </div>
  );
}

export function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-700 mb-1">{children}</label>;
}
