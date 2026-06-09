import { useEffect, useState } from 'react';
import { CheckCircle, Cloud, DollarSign } from 'lucide-react';
import Navbar from '../components/Navbar';
import { recommendationsApi } from '../api/apiClient';

const roiStyles = {
  High: 'bg-green-500/20 text-green-400 border-green-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function Recommendations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [appliedSavings, setAppliedSavings] = useState(0);
  const [applying, setApplying] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await recommendationsApi.list();
      setRecommendations(res.data.recommendations || []);
      setTotalSavings(res.data.total_savings_available || 0);
      setAppliedSavings(res.data.total_savings_applied || 0);
    } catch {
      setError('Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (id) => {
    setApplying(id);
    try {
      const res = await recommendationsApi.apply(id);
      setTotalSavings(res.data.total_savings_available);
      await fetchData();
    } catch {
      setError('Failed to apply recommendation.');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="page-transition">
      <Navbar title="Recommendations" subtitle="AI-generated cost optimization suggestions" />

      <div className="card bg-accent/10 border-accent/30 mb-8 flex items-center gap-4">
        <div className="p-3 bg-accent/20 rounded-xl">
          <DollarSign className="w-8 h-8 text-accent" />
        </div>
        <div>
          {loading ? (
            <div className="skeleton h-8 w-48" />
          ) : (
            <>
              <p className="text-sm text-slate-400">Total Savings Available</p>
              <p className="text-3xl font-bold text-white">
                ${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}/month
              </p>
              {appliedSavings > 0 && (
                <p className="text-sm text-green-400 mt-1">
                  ${appliedSavings.toLocaleString()} already applied
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="card border-red-500/30 bg-red-500/10 text-red-300 mb-6">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-32 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`card transition-all duration-200 ${
                rec.is_applied ? 'opacity-60 border-green-500/30' : 'hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400">{rec.cloud}</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    roiStyles[rec.roi] || roiStyles.Medium
                  }`}
                >
                  {rec.roi} ROI
                </span>
              </div>

              <h4 className="font-mono text-sm text-accent mb-2">{rec.resource_name}</h4>
              <p className="text-sm text-red-400/80 mb-2">
                <span className="font-medium text-red-400">Issue: </span>
                {rec.issue}
              </p>
              <p className="text-sm text-slate-300 mb-4">
                <span className="font-medium text-slate-200">Action: </span>
                {rec.recommended_action}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                <div>
                  <p className="text-xs text-slate-400">Est. Monthly Savings</p>
                  <p className="text-xl font-bold text-green-400">
                    ${rec.estimated_savings.toLocaleString()}
                  </p>
                </div>
                {rec.is_applied ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <CheckCircle className="w-5 h-5" />
                    Applied
                  </div>
                ) : (
                  <button
                    onClick={() => handleApply(rec.id)}
                    disabled={applying === rec.id}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {applying === rec.id ? 'Applying...' : 'Apply'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
