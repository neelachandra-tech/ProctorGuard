import React from 'react';
import {
  ShieldCheck,
  Eye,
  Camera,
  Keyboard,
  Lock,
  Cpu,
  Users,
  FileText,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  ArrowRight,
  ShieldAlert,
  Hash,
} from 'lucide-react';

interface SecurityOverviewProps {
  onNavigate: (tab: 'OVERVIEW' | 'ENROLLMENT' | 'EXAMINEE' | 'EXAMINER' | 'REPORT' | 'K8S') => void;
  isNativeKiosk?: boolean;
  systemSecurityScore: number;
}

export const SecurityOverview: React.FC<SecurityOverviewProps> = ({
  onNavigate,
  isNativeKiosk = false,
  systemSecurityScore,
}) => {
  const securityLayers = [
    {
      id: 'L1',
      title: 'Continuous Facial Liveness',
      tech: 'FaceNet 512-D + 468-pt Mesh + Blink Detector',
      description: 'Continuous biometric re-authentication matching candidate against enrolled embedding, with blink frequency verification (14-18/min) to prevent photo/screen spoofing.',
      badge: 'ACTIVE (96.4% Match)',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      icon: Camera,
      actionTab: 'EXAMINEE' as const,
      actionText: 'View Live HUD',
    },
    {
      id: 'L2',
      title: 'Gaze-Tracking & Off-Screen Attention',
      tech: '3D Eye Vector (Yaw/Pitch) Estimator',
      description: 'Calculates gaze direction in real time to detect off-screen glances, auxiliary monitors, concealed mobile devices, or external notes.',
      badge: 'FOCUSED ON SCREEN',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
      icon: Eye,
      actionTab: 'EXAMINEE' as const,
      actionText: 'Test Gaze Tracker',
    },
    {
      id: 'L3',
      title: 'OS & Browser Lockdown',
      tech: 'Win32 WH_KEYBOARD_LL + Focus Watchdog',
      description: 'Low-level OS hook intercepting Alt+Tab, Windows Key, PrintScreen, multi-monitor extensions, and background application switching.',
      badge: isNativeKiosk ? 'KERNEL HOOK ACTIVE' : 'BROWSER GUARD READY',
      badgeColor: isNativeKiosk ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' : 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
      icon: Lock,
      actionTab: 'EXAMINEE' as const,
      actionText: 'Inspect Interceptor',
    },
    {
      id: 'L4',
      title: 'Keystroke Dynamics Biometrics',
      tech: 'Dwell & Flight Time Variance Classifier',
      description: 'Analyzes typing rhythm, key press duration (dwell: 108ms), and interval transitions (flight: 135ms) to catch candidate impersonation and ghostwriters.',
      badge: 'GENUINE RHYTHM',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      icon: Keyboard,
      actionTab: 'EXAMINEE' as const,
      actionText: 'Test Typing Engine',
    },
    {
      id: 'L5',
      title: 'Ensemble Anomaly Classifier',
      tech: 'Temporal Fusion Engine (Go :8081)',
      description: 'Fuses visual, gaze, acoustic (Silero VAD), and keystroke signals with exponential time decay to assign a live 0-100 integrity confidence score.',
      badge: `SCORE: ${systemSecurityScore}/100`,
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
      icon: Activity,
      actionTab: 'REPORT' as const,
      actionText: 'View Fusion Report',
    },
    {
      id: 'L6',
      title: 'Proctor Command Center (500+)',
      tech: 'Live WebRTC Grid & Threat Priority Queue',
      description: 'Scales to monitor 500+ concurrent examinees simultaneously. Proctors receive prioritized anomaly alerts with timestamped video evidence clips.',
      badge: '1,048 SESSIONS SCALED',
      badgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/40',
      icon: Users,
      actionTab: 'EXAMINER' as const,
      actionText: 'Open Proctor Grid',
    },
    {
      id: 'L7',
      title: 'Encrypted Media Evidence Chains',
      tech: 'AES-256 GCM + SHA-256 Audit Merkle Tree',
      description: 'All webcam clips and telemetry snapshots are cryptographically encrypted and sealed with SHA-256 hashes for non-repudiation.',
      badge: 'CHAIN SEALED (SHA-256)',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      icon: Hash,
      actionTab: 'REPORT' as const,
      actionText: 'Verify Signatures',
    },
    {
      id: 'L8',
      title: 'Post-Exam Grievance Resolution',
      tech: 'Forensic Audit Timeline & Dispute Portal',
      description: 'Provides a complete timestamped violation log, gaze attention heatmaps, keystroke curves, and an official candidate grievance appeal workflow.',
      badge: 'AUDIT LOG READY',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
      icon: FileText,
      actionTab: 'REPORT' as const,
      actionText: 'Open Grievance Audit',
    },
    {
      id: 'L9',
      title: 'High-Concurrency Distributed Mesh',
      tech: 'Go API Gateway + Redis Pub/Sub + ClickHouse',
      description: 'Cloud-native distributed infrastructure designed to sustain 500-1,000 concurrent examination sessions with sub-50ms telemetry latency.',
      badge: 'K8S MESH HEALTHY',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      icon: Server,
      actionTab: 'K8S' as const,
      actionText: 'Inspect Architecture',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* 1. HERO MISSION CONTROL HEADER */}
      <div className="relative glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Layer Enterprise Remote Proctoring Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
              Proctor<span className="text-cyan-400">Guard</span> Integrity Platform
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Enforcing uncompromising examination integrity through continuous multi-modal biometric liveness,
              gaze vector tracking, OS/browser lockdown, keystroke dynamics, ensemble anomaly scoring, and cryptographic
              audit trails for over 500+ concurrent candidates.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>FaceNet Biometric</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Blink Frequency (16/min)</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gaze Deviation Guard</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Win32 Alt+Tab Lockdown</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Keystroke Impersonation Check</span>
              </span>
            </div>
          </div>

          {/* Quick Action Primary Launcher */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
            <button
              onClick={() => onNavigate('EXAMINEE')}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all font-mono"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Launch Live Proctored Exam</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('EXAMINER')}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm transition-all font-mono"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Proctor Command Center (500+)</span>
            </button>

            <button
              onClick={() => onNavigate('ENROLLMENT')}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Biometric Enrollment Gate</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME HARDWARE & SYSTEM STATUS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">OS Security Lockdown</span>
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {isNativeKiosk ? 'WH_KEYBOARD_LL Active' : 'Browser Guard Active'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Alt+Tab, Win, TaskMgr Hooked</div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Hardware Attestation</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono">Bare-Metal Verified</div>
          <div className="text-[11px] text-slate-500 font-mono">CPUID Hypervisor Check: 0</div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Concurrent Sessions</span>
            <Users className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono">500+ Capable</div>
          <div className="text-[11px] text-slate-500 font-mono">1,048 Scaled in Proctor Matrix</div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Cryptographic Seal</span>
            <Hash className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono">SHA-256 Audit Trail</div>
          <div className="text-[11px] text-slate-500 font-mono">HMAC Immutable Evidence</div>
        </div>
      </div>

      {/* 3. NINE CORE INTEGRITY LAYERS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
              <span>9 Enforced Security Layers</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                100% Verified
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Click any layer to inspect its live HUD, simulation parameters, or audit verification.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {securityLayers.map((layer) => {
            const IconComponent = layer.icon;
            return (
              <div
                key={layer.id}
                className="bg-[#0e131f] hover:bg-[#121827] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${layer.badgeColor}`}>
                      {layer.badge}
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">{layer.id} • {layer.tech}</div>
                    <h3 className="text-base font-bold text-white mt-0.5">{layer.title}</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {layer.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-850 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">Multimodal Sentinel</span>
                  <button
                    onClick={() => onNavigate(layer.actionTab)}
                    className="flex items-center space-x-1 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>{layer.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PLATFORM PORTALS NAVIGATION CAROUSEL */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white">Platform Modules & Direct Portals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={() => onNavigate('ENROLLMENT')}
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all group"
          >
            <Camera className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">1. Biometric Gate</div>
            <div className="text-[11px] text-slate-400 mt-1">468-pt Mesh & Acoustic Sample</div>
          </button>

          <button
            onClick={() => onNavigate('EXAMINEE')}
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all group"
          >
            <Zap className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">2. Live Proctored Exam</div>
            <div className="text-[11px] text-slate-400 mt-1">FaceNet HUD & Typing Sandbox</div>
          </button>

          <button
            onClick={() => onNavigate('EXAMINER')}
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all group"
          >
            <Users className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">3. Proctor Center (500+)</div>
            <div className="text-[11px] text-slate-400 mt-1">Live Multi-Candidate Grid</div>
          </button>

          <button
            onClick={() => onNavigate('REPORT')}
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all group"
          >
            <FileText className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">4. Grievance Audit</div>
            <div className="text-[11px] text-slate-400 mt-1">Forensic Timeline & Dispute Form</div>
          </button>

          <button
            onClick={() => onNavigate('K8S')}
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all group"
          >
            <Server className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">5. K8s Infrastructure</div>
            <div className="text-[11px] text-slate-400 mt-1">Microservices & Scaling Mesh</div>
          </button>
        </div>
      </div>
    </div>
  );
};
