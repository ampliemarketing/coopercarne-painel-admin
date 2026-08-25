export function SpeciesDonutCard({ title, current, capacity, unit = "cab." }: { title: string; current: number; capacity: number; unit?: string }) {
  const percentage = capacity > 0 ? Math.min(100, Math.round((current / capacity) * 100)) : 0;
  const balance = Math.max(0, capacity - current);
  const strokeWidth = 8;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm text-center flex flex-col items-center justify-between hover:shadow-md transition-shadow">
      <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-900 mb-2">{title}</h4>
      
      {/* Gráfico Donut Circular em Destaque */}
      <div className="relative w-24 h-24 flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="text-slate-900 transition-all duration-500 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <span className="absolute font-extrabold text-sm text-slate-900 tracking-tight">
          {percentage}%
        </span>
      </div>

      {/* Agendados / Capacidade e Saldo */}
      <div className="mt-2 space-y-1">
        <p className="text-xs text-slate-500 font-medium">
          <strong className="font-bold text-slate-900 text-sm">{current}</strong>/{capacity} {unit}
        </p>
        <p className="text-xs font-semibold text-teal-700">
          Saldo: {balance}
        </p>
      </div>
    </div>
  );
}
