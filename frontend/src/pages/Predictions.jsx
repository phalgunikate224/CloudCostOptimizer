import { useEffect, useState } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Lightbulb } from 'lucide-react';
import Navbar from '../components/Navbar';
import { predictionsApi } from '../api/apiClient';

const CLOUDS = ['All', 'AWS', 'Azure', 'GCP'];

export default function Predictions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCloud, setSelectedCloud] = useState('All');
  const [chartData, setChartData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [predictionsByCloud, setPredictionsByCloud] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const cloudParam = selectedCloud === 'All' ? null : selectedCloud;
        const res = await predictionsApi.getForecast(cloudParam);

        const historical = (res.data.historical || []).slice(-30);
        const predictions = res.data.predictions || [];

        const histData = historical.map((h) => ({
          date: h.date.slice(5),
          actual: h.cost,
          predicted: null,
          ciLower: null,
          ciUpper: null,
        }));

        const predData = predictions.map((p) => ({
          date: p.date.slice(5),
          actual: null,
          predicted: p.predicted_cost,
          ciLower: p.confidence_interval.lower,
          ciUpper: p.confidence_interval.upper,
        }));

        setChartData([...histData, ...predData]);
        setInsights(res.data.insights || []);
        if (res.data.predictions_by_cloud) {
          setPredictionsByCloud(res.data.predictions_by_cloud);
        }
      } catch {
        setError('Failed to load prediction data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCloud]);

  return (
    <div className="page-transition">
      <Navbar title="Predictions" subtitle="ML-powered cost forecasting" />

      <div className="flex gap-2 mb-6">
        {CLOUDS.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCloud(c)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCloud === c
                ? 'bg-accent text-white'
                : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-700/50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {error && (
        <div className="card border-red-500/30 bg-red-500/10 text-red-300 mb-6">{error}</div>
      )}

      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-white mb-6">
          Actual vs Predicted Cost — {selectedCloud}
        </h3>
        {loading ? (
          <div className="skeleton h-80 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="ciUpper"
                stroke="none"
                fill="#6366f1"
                fillOpacity={0.15}
                name="Confidence Upper"
              />
              <Area
                type="monotone"
                dataKey="ciLower"
                stroke="none"
                fill="#0f172a"
                fillOpacity={1}
                name="Confidence Lower"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Actual Cost"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                name="Predicted Cost"
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton h-20 w-full" />
              </div>
            ))
          : insights.map((insight, idx) => (
              <div key={idx} className="card flex gap-3 items-start">
                <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
              </div>
            ))}
      </div>

      {selectedCloud === 'All' && Object.keys(predictionsByCloud).length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {Object.entries(predictionsByCloud).map(([cloud, preds]) => {
            const total = preds.reduce((s, p) => s + p.predicted_cost, 0);
            return (
              <div key={cloud} className="card">
                <p className="text-sm text-slate-400 mb-1">{cloud} 30-Day Forecast</p>
                <p className="text-2xl font-bold text-white">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
