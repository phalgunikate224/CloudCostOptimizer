import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Navbar from '../components/Navbar';
import { costsApi } from '../api/apiClient';

const SERVICES = ['Compute', 'Storage', 'Network', 'Database', 'AI/ML'];
const SERVICE_COLORS = {
  Compute: '#6366f1',
  Storage: '#8b5cf6',
  Network: '#06b6d4',
  Database: '#10b981',
  'AI/ML': '#f59e0b',
};

export default function CostAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);
  const [cloud, setCloud] = useState('');
  const [chartData, setChartData] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await costsApi.getBreakdown(days, cloud || null);
        const daily = res.data.daily || [];

        const formatted = daily.map((day) => {
          const entry = { date: day.date.slice(5) };
          SERVICES.forEach((svc) => {
            entry[svc] = 0;
            Object.values(day.clouds || {}).forEach((cloudServices) => {
              entry[svc] += cloudServices[svc] || 0;
            });
          });
          return entry;
        });

        setChartData(formatted);
        setTableRows(res.data.records || []);
        setTotalCost(res.data.total_cost || 0);
      } catch {
        setError('Failed to load cost analysis data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days, cloud]);

  return (
    <div className="page-transition">
      <Navbar title="Cost Analysis" subtitle="Detailed breakdown of cloud spending" />

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Date Range</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="input-field w-40"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Cloud Provider</label>
          <select
            value={cloud}
            onChange={(e) => setCloud(e.target.value)}
            className="input-field w-40"
          >
            <option value="">All Clouds</option>
            <option value="AWS">AWS</option>
            <option value="Azure">Azure</option>
            <option value="GCP">GCP</option>
          </select>
        </div>
        {!loading && (
          <div className="flex items-end">
            <p className="text-sm text-slate-400">
              Total: <span className="text-white font-semibold">${totalCost.toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="card border-red-500/30 bg-red-500/10 text-red-300 mb-6">{error}</div>
      )}

      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-white mb-6">Daily Cost by Service</h3>
        {loading ? (
          <div className="skeleton h-72 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
              />
              <Legend />
              {SERVICES.map((svc) => (
                <Area
                  key={svc}
                  type="monotone"
                  dataKey={svc}
                  stackId="1"
                  stroke={SERVICE_COLORS[svc]}
                  fill={SERVICE_COLORS[svc]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card overflow-hidden">
        <h3 className="text-lg font-semibold text-white mb-4">Cost Details</h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Cloud</th>
                  <th className="pb-3 pr-4 font-medium">Service</th>
                  <th className="pb-3 pr-4 font-medium text-right">Cost</th>
                  <th className="pb-3 font-medium text-right">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(-50).reverse().map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-3 pr-4 text-slate-300">{row.date}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-200">
                        {row.cloud}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{row.service}</td>
                    <td className="py-3 pr-4 text-right text-white font-medium">
                      ${row.cost.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-slate-400">{row.percent_of_total}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
