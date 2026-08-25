import React from 'react';

export function StatCard({ label, value, valueColor, sub, icon: Icon, badge }: { label: string; value: string; valueColor?: string; sub: string; icon: React.ElementType; badge?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
          <Icon className="w-4 h-4 text-slate-700" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className={`text-2xl font-bold tracking-tight ${valueColor || 'text-slate-900'}`}>{value}</div>
        {badge && (
          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-400 font-medium mt-1">{sub}</p>
    </div>
  );
}
