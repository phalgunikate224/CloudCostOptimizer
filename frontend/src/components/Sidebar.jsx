import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Shield,
  FlaskConical,
  Cloud,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cost-analysis', icon: BarChart3, label: 'Cost Analysis' },
  { to: '/predictions', icon: TrendingUp, label: 'Predictions' },
  { to: '/anomalies', icon: AlertTriangle, label: 'Anomalies' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
  { to: '/policies', icon: Shield, label: 'Policy Manager' },
  { to: '/simulation', icon: FlaskConical, label: 'Simulation' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-850 border-r border-slate-700/50 flex flex-col z-30">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div className="p-2 bg-accent/20 rounded-lg">
          <Cloud className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">Cloud Cost</h1>
          <p className="text-xs text-slate-400">Optimizer</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 text-center">AI-Powered v1.0</p>
      </div>
    </aside>
  );
}
