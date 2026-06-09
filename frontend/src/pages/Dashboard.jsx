import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, PiggyBank } from 'lucide-react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { costsApi, predictionsApi, anomaliesApi, recommendationsApi } from '../api/apiClient';

const CLOUD_COLORS = { AWS: '#FF9900', Azure: '#0078D4', GCP: '#4285F4' };
const SERVICE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
      <p className="text-slate-300 text-sm mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-sm font-medium">
          {entry.name}: ${entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [multicloud, setMulticloud] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [predictedSpend, setPredictedSpend] = useState(0);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [savingsAvailable, setSavingsAvailable] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, multicloudRes, trendRes, serviceRes, forecastRes, anomalyRes, recRes] =
          await Promise.all([
            costsApi.getSummary(),
            costsApi.getMulticloud(6),
            costsApi.getDailyTrend(30),
            costsApi.getServiceBreakdown(30),
            predictionsApi.getForecast(),
            anomaliesApi.detect(),
            recommendationsApi.list(),
          ]);

        setSummary(summaryRes.data);
        setMulticloud(multicloudRes.data.monthly_data || []);
        setDailyTrend(trendRes.data.data || []);
        setServiceBreakdown(serviceRes.data.data || []);

        const predictions = forecastRes.data.predictions || [];
        const nextMonthPredicted = predictions.reduce((sum, p) => sum + p.predicted_cost, 0);
        setPredictedSpend(nextMonthPredicted);

        setAnomalyCount(anomalyRes.data.total || 0);
        setSavingsAvailable(recRes.data.total_savings_available || 0);
      } catch (err) {
        setError('Failed to load dashboard data. Make sure the backend is running on port 8000.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="page-transition">
        <Navbar title="Dashboard" subtitle="Overview of your cloud spending" />
        <div className="card border-red-500/30 bg-red-500/10 text-red-300">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <Navbar title="Dashboard" subtitle="Overview of your cloud spending" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Cloud Spend This Month"
          value={summary?.total_spend || 0}
          change={summary?.overall_change_percent}
          changeLabel="vs last month"
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Predicted Spend Next Month"
          value={predictedSpend}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Active Anomalies Detected"
          value={anomalyCount}
          prefix=""
          icon={AlertTriangle}
          loading={loading}
        />
        <StatCard
          title="Estimated Savings Available"
          value={savingsAvailable}
          icon={PiggyBank}
          loading={loading}
        />
      </div>

      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-white mb-6">Multi-Cloud Cost Comparison (6 Months)</h3>
        {loading ? (
          <div className="skeleton h-72 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={multicloud} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="AWS" fill={CLOUD_COLORS.AWS} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Azure" fill={CLOUD_COLORS.Azure} radius={[4, 4, 0, 0]} />
              <Bar dataKey="GCP" fill={CLOUD_COLORS.GCP} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-6">Daily Cost Trend (30 Days)</h3>
          {loading ? (
            <div className="skeleton h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="cost"
                  name="Daily Cost"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-6">Cost Breakdown by Service</h3>
          {loading ? (
            <div className="skeleton h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={serviceBreakdown}
                  dataKey="cost"
                  nameKey="service"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {serviceBreakdown.map((_, index) => (
                    <Cell key={index} fill={SERVICE_COLORS[index % SERVICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']}
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
