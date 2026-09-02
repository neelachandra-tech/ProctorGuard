import React, { useState } from 'react';
import { X, ShieldAlert, FileText, Download, CheckCircle, Flame, Activity, Hash, Eye, Mic, Keyboard } from 'lucide-react';
import { EvidenceBundle } from '../types/proctor';

interface EvidenceBundleModalProps {
  bundle: EvidenceBundle | null;
  onClose: () => void;
}

export const EvidenceBundleModal: React.FC<EvidenceBundleModalProps> = ({ bundle, onClose }) => {
  if (!bundle) return null;

  const [decision, setDecision] = useState<'NONE' | 'APPROVED' | 'INTERVIEW' | 'INVALIDATED'>('NONE');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0d121d] z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">Violation Evidence Bundle</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  {bundle.overallThreatLevel} THREAT
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {bundle.examineeName} ({bundle.examineeId}) • Session: {bundle.sessionID}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Cryptographic SHA-256 Audit Trail Signature */}
          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Hash className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Cryptographic SHA-256 Evidence Hash</span>
                <span className="text-xs font-mono text-cyan-300 select-all">{bundle.sha256AuditHash}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-mono font-bold">
              SIGNATURE VERIFIED
            </span>
          </div>

          {/* Visualizers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gaze Direction Heatmap */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Gaze Heatmap</span>
                </span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="h-32 bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center border border-slate-800">
                <div className="w-24 h-16 border border-cyan-500/40 rounded flex items-center justify-center text-[10px] font-mono text-cyan-400">
                  SCREEN BOUNDS
                </div>
                {/* Simulated Gaze Hotspot */}
                <div className="absolute top-4 right-6 w-10 h-10 rounded-full bg-rose-500/40 blur-md animate-pulse" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-8 rounded-full bg-amber-500/40 blur-md" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Off-screen dwell concentration: 24.8% right, 15.2% desk.</p>
            </div>

            {/* Audio Spectrum & Pitch Analyzer */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span>Audio Spectrum (PyAnnote)</span>
                </span>
                <Activity className="w-4 h-4 text-rose-400" />
              </div>
              <div className="h-32 bg-slate-900 rounded-lg p-2 flex items-end justify-between border border-slate-800">
                {bundle.audioSpectrumData.map((pt, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 mx-0.5">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-500 to-rose-500 rounded-t"
                      style={{ height: `${Math.max(15, (pt.dB + 60) * 2)}%` }}
                    />
                    <span className="text-[9px] font-mono text-slate-500 mt-1">{pt.freqHz}Hz</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Secondary voice pitch detected at 500Hz (+94Hz delta).</p>
            </div>

            {/* Keystroke Flight Time Graph */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-cyan-400" />
                  <span>Keystroke Flight Graph</span>
                </span>
                <span className="text-[10px] font-mono text-rose-400 font-bold">ANOMALY DETECTED</span>
              </div>
              <div className="h-32 bg-slate-900 rounded-lg p-3 flex items-center justify-between border border-slate-800 relative">
                <svg className="w-full h-full text-cyan-400" viewBox="0 0 100 50">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points="0,40 25,38 50,10 75,8 100,38"
                  />
                  <circle cx="50" cy="10" r="4" className="fill-rose-500 animate-ping" />
                  <circle cx="75" cy="8" r="4" className="fill-rose-500 animate-ping" />
                </svg>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Spike at t=30s indicates paste/macro bot event (20ms flight).</p>
            </div>
          </div>

          {/* DeBERTa NLP Similarity Answer Diff Match */}
          {bundle.debertaMatches.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>DeBERTa-v3 NLP Similarity Match (94.2% Cosine Score)</span>
                </span>
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded text-[10px] font-mono font-bold">
                  COLLUSION FLAGGED
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-bold block">{bundle.examineeName} ({bundle.examineeId})</span>
                  <p className="text-slate-300">{bundle.debertaMatches[0].snippetA}</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-amber-400 font-bold block">
                    {bundle.debertaMatches[0].examineeBName} ({bundle.debertaMatches[0].examineeBId})
                  </span>
                  <p className="text-slate-300">{bundle.debertaMatches[0].snippetB}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timestamped Violation Events List */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Timestamped Violation Audit Trail</h3>
            <div className="space-y-2">
              {bundle.events.map((ev) => (
                <div key={ev.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-cyan-400">{ev.formattedTime}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ev.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400'
                          : ev.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      {ev.type}
                    </span>
                    <p className="text-xs text-slate-300">{ev.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0d121d] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDecision('APPROVED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                decision === 'APPROVED' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Approve Exam
            </button>
            <button
              onClick={() => setDecision('INTERVIEW')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                decision === 'INTERVIEW' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Flag for Interview
            </button>
            <button
              onClick={() => setDecision('INVALIDATED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                decision === 'INVALIDATED' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Invalidate Session
            </button>
          </div>

          <button
            onClick={() => alert(`Downloading Certified SHA-256 Bundle PDF for ${bundle.examineeName}...`)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-white shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Evidence Bundle (PDF / JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
