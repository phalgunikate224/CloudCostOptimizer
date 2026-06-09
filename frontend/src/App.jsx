import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CostAnalysis from './pages/CostAnalysis';
import Predictions from './pages/Predictions';
import Anomalies from './pages/Anomalies';
import Recommendations from './pages/Recommendations';
import PolicyManager from './pages/PolicyManager';
import Simulation from './pages/Simulation';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-60 min-h-screen p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cost-analysis" element={<CostAnalysis />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/policies" element={<PolicyManager />} />
          <Route path="/simulation" element={<Simulation />} />
        </Routes>
      </main>
    </div>
  );
}
