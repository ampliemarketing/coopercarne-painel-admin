export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 pb-3 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">{title}</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">{description}</p>
      </div>
      <div className="h-1.5 w-8 bg-slate-700 rounded-full"></div>
    </div>
  );
}
