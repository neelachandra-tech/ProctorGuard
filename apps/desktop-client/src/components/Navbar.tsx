import React from 'react';
import { ShieldCheck, UserCheck, Monitor, Lock } from 'lucide-react';

interface NavbarProps {
  activeTab: 'ENROLLMENT' | 'EXAMINEE' | 'EXAMINER' | 'K8S';
  setActiveTab: (tab: 'ENROLLMENT' | 'EXAMINEE' | 'EXAMINER' | 'K8S') => void;
  systemSecurityScore: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, systemSecurityScore }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0d121d]/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between shadow-xl">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('EXAMINEE')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-xl tracking-tight text-white font-sans">
              Proctor<span className="text-cyan-400">Guard</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              CANDIDATE KIOSK
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Biometric-Secured Lockdown Container</p>
        </div>
      </div>

      {/* Candidate Navigation Tabs Only */}
      <nav className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('ENROLLMENT')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ENROLLMENT'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Biometric Enrollment</span>
        </button>

        <button
          onClick={() => setActiveTab('EXAMINEE')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'EXAMINEE'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Examinee Workspace</span>
        </button>
      </nav>

      {/* Security Status Badge & Hardware Attestation */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>OS Lockdown Active</span>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Attestation Score</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{systemSecurityScore}%</span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>
    </header>
  );
};
