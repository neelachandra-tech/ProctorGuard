import React from 'react';
import { ShieldCheck, UserCheck, Monitor, Lock, Users, FileText, Cpu, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'OVERVIEW' | 'ENROLLMENT' | 'EXAMINEE' | 'EXAMINER' | 'REPORT' | 'K8S';
  setActiveTab: (tab: 'OVERVIEW' | 'ENROLLMENT' | 'EXAMINEE' | 'EXAMINER' | 'REPORT' | 'K8S') => void;
  systemSecurityScore: number;
  isNativeKiosk?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  systemSecurityScore,
  isNativeKiosk = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0d121d]/90 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between shadow-xl gap-4">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('OVERVIEW')}>
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
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isNativeKiosk
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/50'
            }`}>
              {isNativeKiosk ? 'WIN32 NATIVE KIOSK' : 'WEB DEMO'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {isNativeKiosk ? 'Kernel Hook WH_KEYBOARD_LL Active' : 'Multi-Agent Biometric Proctoring Platform'}
          </p>
        </div>
      </div>

      {/* Full Multi-Layer Navigation */}
      <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex-wrap">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'OVERVIEW'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('ENROLLMENT')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ENROLLMENT'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>1. Biometric Gate</span>
        </button>

        <button
          onClick={() => setActiveTab('EXAMINEE')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'EXAMINEE'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>2. Live Proctored Exam</span>
        </button>

        <button
          onClick={() => setActiveTab('EXAMINER')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'EXAMINER'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>3. Proctor Center (500+)</span>
        </button>

        <button
          onClick={() => setActiveTab('REPORT')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'REPORT'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>4. Grievance Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('K8S')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'K8S'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>5. Architecture</span>
        </button>
      </nav>

      {/* Security Status Badge & Hardware Attestation */}
      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-2 px-3 py-1.5 border rounded-xl text-xs font-mono ${
          isNativeKiosk
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
        }`}>
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isNativeKiosk ? 'Native Kernel Hook Active' : 'OS Lockdown Active'}</span>
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
