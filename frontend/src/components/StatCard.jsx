import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, changeLabel, icon: Icon, loading, prefix = '$' }) {
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-4 w-32 mb-4" />
        <div className="skeleton h-8 w-24 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  const isPositive = change >= 0;
  const isCostMetric = title.toLowerCase().includes('spend') || title.toLowerCase().includes('cost');
  const changeIsBad = isCostMetric ? isPositive : !isPositive;

  return (
    <div className="card hover:border-slate-600 transition-colors duration-200">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        {Icon && (
          <div className="p-2 bg-accent/10 rounded-lg">
            <Icon className="w-5 h-5 text-accent" />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-2">
        {typeof value === 'number' && prefix === '$'
          ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          : value}
      </p>
      {change !== undefined && change !== null && (
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className={`w-4 h-4 ${changeIsBad ? 'text-red-400' : 'text-green-400'}`} />
          ) : (
            <TrendingDown className={`w-4 h-4 ${changeIsBad ? 'text-green-400' : 'text-red-400'}`} />
          )}
          <span className={`text-sm font-medium ${changeIsBad ? 'text-red-400' : 'text-green-400'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-xs text-slate-500">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card">
      <div className="skeleton h-4 w-32 mb-4" />
      <div className="skeleton h-8 w-24 mb-2" />
      <div className="skeleton h-3 w-20" />
    </div>
  );
}
