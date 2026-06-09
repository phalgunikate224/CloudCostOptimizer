import { Bell, Search } from 'lucide-react';

export default function Navbar({ title, subtitle }) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources..."
            className="input-field pl-10 w-64 text-sm"
          />
        </div>
        <button className="relative p-2 rounded-lg bg-slate-850 border border-slate-700/50 hover:bg-slate-700 transition-colors">
          <Bell className="w-5 h-5 text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-white">
          CO
        </div>
      </div>
    </header>
  );
}
