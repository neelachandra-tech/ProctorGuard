import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExaminerDashboard } from './components/ExaminerDashboard';
import './index.css';

export const ExaminerPortalStandaloneApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 font-sans flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-[#0d121d] py-3 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white font-mono text-sm shadow-md">
            PG
          </div>
          <span className="font-extrabold text-white text-lg tracking-tight">
            ProctorGuard <span className="text-xs text-cyan-400 font-mono font-normal">| Examiner Web Portal</span>
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Fusion Engine Connected (:8081)
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            Proctor ID: PR-809
          </span>
        </div>
      </header>

      <main className="flex-1 pb-12">
        <ExaminerDashboard />
      </main>

      <footer className="border-t border-slate-900 bg-[#07090f] py-4 text-center text-xs font-mono text-slate-500">
        ProctorGuard v2.4 Standalone Examiner Web Portal • Live Multi-Agent AI Anomaly Stream Reviewer
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ExaminerPortalStandaloneApp />
  </React.StrictMode>
);
