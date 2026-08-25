import React from 'react';

export function Badge({ children, variant }: { children: React.ReactNode; variant: 'blue' | 'purple' | 'green' | 'red' | 'amber' | 'gray' }) {
  const styles = {
    blue: 'bg-slate-100 text-slate-800 border-slate-200',
    purple: 'bg-slate-100 text-slate-700 border-slate-200',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold border rounded ${styles[variant]}`}>
      {children}
    </span>
  );
}
