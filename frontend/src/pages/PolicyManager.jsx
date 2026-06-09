import { useEffect, useState } from 'react';
import { Trash2, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { policiesApi } from '../api/apiClient';

export default function PolicyManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    cloud: 'AWS',
    condition: 'cost > threshold',
    threshold: 500,
    action: 'Alert',
  });

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await policiesApi.list();
      setPolicies(res.data.policies || []);
    } catch {
      setError('Failed to load policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await policiesApi.create(form);
      setForm({ name: '', cloud: 'AWS', condition: 'cost > threshold', threshold: 500, action: 'Alert' });
      await fetchPolicies();
    } catch {
      setError('Failed to create policy.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id, currentActive) => {
    try {
      await policiesApi.toggle(id, !currentActive);
      await fetchPolicies();
    } catch {
      setError('Failed to update policy.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await policiesApi.delete(id);
      await fetchPolicies();
    } catch {
      setError('Failed to delete policy.');
    }
  };

  return (
    <div className="page-transition">
      <Navbar title="Policy Manager" subtitle="Automate cost control policies" />

      {error && (
        <div className="card border-red-500/30 bg-red-500/10 text-red-300 mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="card xl:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-white">Create Policy</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Policy Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="e.g. AWS Daily Budget Alert"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cloud</label>
              <select
                value={form.cloud}
                onChange={(e) => setForm({ ...form, cloud: e.target.value })}
                className="input-field"
              >
                <option value="AWS">AWS</option>
                <option value="Azure">Azure</option>
                <option value="GCP">GCP</option>
                <option value="All">All</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="input-field"
              >
                <option value="cost > threshold">Cost &gt; $X/day</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Threshold ($/day)</label>
              <input
                type="number"
                required
                min="1"
                value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Action</label>
              <select
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
                className="input-field"
              >
                <option value="Alert">Alert</option>
                <option value="Pause">Pause</option>
                <option value="Scale Down">Scale Down</option>
              </select>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Policy'}
            </button>
          </form>
        </div>

        <div className="card xl:col-span-2 overflow-hidden">
          <h3 className="text-lg font-semibold text-white mb-4">Active Policies</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          ) : policies.length === 0 ? (
            <p className="text-slate-400 text-sm">No policies created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-left">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Cloud</th>
                    <th className="pb-3 pr-4 font-medium">Threshold</th>
                    <th className="pb-3 pr-4 font-medium">Action</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Active</th>
                    <th className="pb-3 font-medium">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => (
                    <tr key={policy.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-3 pr-4 text-white font-medium">{policy.name}</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-200">
                          {policy.cloud}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">${policy.threshold}/day</td>
                      <td className="py-3 pr-4 text-slate-300">{policy.action}</td>
                      <td className="py-3 pr-4">
                        {policy.triggered_today ? (
                          <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                            <AlertCircle className="w-4 h-4" />
                            Triggered Today
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => handleToggle(policy.id, policy.is_active)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            policy.is_active ? 'bg-accent' : 'bg-slate-600'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              policy.is_active ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDelete(policy.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
