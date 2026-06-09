import { useEffect, useState } from 'react';
import { FlaskConical, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import { simulationApi } from '../api/apiClient';

export default function Simulation() {
  const [resourceTypes, setResourceTypes] = useState([]);
  const [resourceType, setResourceType] = useState('EC2');
  const [currentConfig, setCurrentConfig] = useState({ vcpus: 4, ram_gb: 16, hours_per_day: 24 });
  const [proposedConfig, setProposedConfig] = useState({ vcpus: 2, ram_gb: 8, hours_per_day: 12 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    simulationApi.getResourceTypes().then((res) => {
      setResourceTypes(res.data.resource_types || []);
    }).catch(() => {});
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await simulationApi.run({
        resource_type: resourceType,
        current_config: currentConfig,
        proposed_config: proposedConfig,
      });
      setResult(res.data);
    } catch {
      setError('Failed to run simulation. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const ConfigInputs = ({ config, setConfig, label }) => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-300">{label}</h4>
      <div>
        <label className="block text-xs text-slate-400 mb-1">vCPUs</label>
        <input
          type="number"
          min="1"
          max="128"
          value={config.vcpus}
          onChange={(e) => setConfig({ ...config, vcpus: Number(e.target.value) })}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">RAM (GB)</label>
        <input
          type="number"
          min="1"
          max="512"
          value={config.ram_gb}
          onChange={(e) => setConfig({ ...config, ram_gb: Number(e.target.value) })}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Hours/Day</label>
        <input
          type="number"
          min="1"
          max="24"
          step="0.5"
          value={config.hours_per_day}
          onChange={(e) => setConfig({ ...config, hours_per_day: Number(e.target.value) })}
          className="input-field"
        />
      </div>
    </div>
  );

  return (
    <div className="page-transition">
      <Navbar title="Simulation" subtitle="Simulate resource changes and estimate savings" />

      {error && (
        <div className="card border-red-500/30 bg-red-500/10 text-red-300 mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="card xl:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <FlaskConical className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-white">Resource Configuration</h3>
          </div>

          <div className="mb-6">
            <label className="block text-xs text-slate-400 mb-1">Resource Type</label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="input-field max-w-xs"
            >
              {(resourceTypes.length ? resourceTypes : [{ id: 'EC2' }, { id: 'Azure VM' }, { id: 'GCP Compute' }]).map(
                (rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.label || rt.id}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <ConfigInputs
              config={currentConfig}
              setConfig={setCurrentConfig}
              label="Current Configuration"
            />
            <div className="relative">
              <div className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2">
                <ArrowRight className="w-6 h-6 text-accent" />
              </div>
              <ConfigInputs
                config={proposedConfig}
                setConfig={setProposedConfig}
                label="Proposed Configuration"
              />
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Running Simulation...' : 'Run Simulation'}
          </button>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-6">Simulation Results</h3>
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-16 w-full" />
              <div className="skeleton h-16 w-full" />
              <div className="skeleton h-24 w-full" />
            </div>
          ) : !result ? (
            <p className="text-slate-400 text-sm">
              Configure your resources and click &quot;Run Simulation&quot; to see estimated savings.
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs text-slate-400 mb-1">Current Monthly Cost</p>
                <p className="text-2xl font-bold text-white">
                  ${result.current_monthly_cost.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Proposed Monthly Cost</p>
                <p className="text-2xl font-bold text-accent">
                  ${result.proposed_monthly_cost.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  {result.savings_percent >= 0 ? (
                    <TrendingDown className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  )}
                  <p className="text-sm font-medium text-slate-300">Savings</p>
                </div>
                <p
                  className={`text-3xl font-bold ${
                    result.savings_percent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  ${Math.abs(result.savings_amount).toLocaleString()}
                </p>
                <p
                  className={`text-lg font-semibold mt-1 ${
                    result.savings_percent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {result.savings_percent >= 0 ? '' : '+'}
                  {Math.abs(result.savings_percent)}%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-slate-300 leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
