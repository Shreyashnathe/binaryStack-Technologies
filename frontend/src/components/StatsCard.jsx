export default function StatsCard({ label, value, icon, color = 'blue', hint }) {
  const colorMap = {
    blue:   'from-primary-100 to-primary-50 border-primary-200 text-primary-700',
    purple: 'from-slate-200 to-slate-100 border-slate-300 text-slate-700',
    green:  'from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-700',
    orange: 'from-amber-100 to-amber-50 border-amber-200 text-amber-700',
  };

  return (
    <div className={`stat-card bg-gradient-to-br ${colorMap[color]} animate-fade-in`}>
      <div className="w-14 h-14 rounded-2xl bg-white border border-current/15 flex items-center justify-center text-sm font-bold tracking-wide flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-0.5">{value ?? '--'}</p>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </div>
    </div>
  );
}
