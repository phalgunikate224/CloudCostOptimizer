import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AlertOctagon } from 'lucide-react';
import Navbar from '../components/Navbar';
import { anomaliesApi } from '../api/apiClient';

const severityStyles = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function Anomalies() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [frequency, setFrequency] = useState([]);
  const [hasHighSeverity, setHasHighSeverity] = useState(false);
  const [highCount, setHighCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await anomaliesApi.detect();
        setAnomalies(res.data.anomalies || []);
        setFrequency(res.data.frequency_by_service || []);
        setHasHighSeverity(res.data.has_high_severity || false);
        setHighCount(res.data.high_severity_count || 0);
      } catch {
        setError('Failed to load anomaly data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="page-transition">
      <Navbar title="Anomalies" subtitle="AI-detected cost anomalies" />

      {hasHighSeverity && !loading && (
        <div className="flex items-center gap-3 card border-red-500/40 bg-red-500/10 mb-6">
          <AlertOctagon className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-300">High Severity Alert</p>
            <p className="text-sm text-red-400/80">
              {highCount} high severity anomal{highCount === 1 ? 'y' : 'ies'} detected. Immediate review recommended.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="card border-red-500/30 bg-red-500/10 text-red-300 mb-6">{error}</div>
      )}

      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Anomaly Frequency by Service</h3>
        {loading ? (
          <div className="skeleton h-56 w-full" />
        ) : frequency.length === 0 ? (
          <p className="text-slate-400 text-sm">No anomalies detected.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={frequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="service" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Anomalies" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card overflow-hidden">
        <h3 className="text-lg font-semibold text-white mb-4">Detected Anomalies</h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : anomalies.length === 0 ? (
          <p className="text-slate-400 text-sm">No anomalies found in the selected period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Cloud</th>
                  <th className="pb-3 pr-4 font-medium">Service</th>
                  <th className="pb-3 pr-4 font-medium text-right">Expected</th>
                  <th className="pb-3 pr-4 font-medium text-right">Actual</th>
                  <th className="pb-3 pr-4 font-medium text-right">Deviation</th>
                  <th className="pb-3 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-3 pr-4 text-slate-300">{a.date}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-200">
                        {a.cloud}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{a.service}</td>
                    <td className="py-3 pr-4 text-right text-slate-400">
                      ${a.expected_cost.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right text-white font-medium">
                      ${a.actual_cost.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-300">
                      {a.deviation_percent > 0 ? '+' : ''}{a.deviation_percent}%
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
                          severityStyles[a.severity]
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>
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
