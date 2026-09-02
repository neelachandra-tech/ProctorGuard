import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, Activity, GitCommit, FileText, ExternalLink, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { generateMockExamineeGrid, getMockEvidenceBundle } from '../utils/biometrics';
import { EvidenceBundleModal } from './EvidenceBundleModal';
import { EvidenceBundle } from '../types/proctor';

export const ExaminerPortal: React.FC = () => {
  const [examineeGrid, setExamineeGrid] = useState(generateMockExamineeGrid(24));
  const [filterThreat, setFilterThreat] = useState<'ALL' | 'CRITICAL' | 'SUSPICIOUS' | 'CLEAR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Selected Evidence Bundle Modal
  const [activeBundle, setActiveBundle] = useState<EvidenceBundle | null>(null);

  // Tab: Grid vs Collusion Matrix Graph
  const [viewMode, setViewMode] = useState<'GRID' | 'COLLUSION_GRAPH'>('GRID');

  const filteredExaminees = examineeGrid.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || ex.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesThreat = filterThreat === 'ALL' || ex.threatLevel === filterThreat;
    return matchesSearch && matchesThreat;
  });

  const inspectExamineeBundle = (id: string, name: string) => {
    const bundle = getMockEvidenceBundle(id, name);
    setActiveBundle(bundle);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-sans flex items-center gap-2">
            <span>Examiner Control Center</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              1,048 Concurrently Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time multi-modal anomaly fusion engine & DeBERTa cross-examinee collusion monitoring.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('GRID')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
              viewMode === 'GRID' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Sessions Grid
          </button>
          <button
            onClick={() => setViewMode('COLLUSION_GRAPH')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
              viewMode === 'COLLUSION_GRAPH' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DeBERTa Collusion Network
          </button>
        </div>
      </div>

      {/* VIEW 1: LIVE SESSIONS GRID */}
      {viewMode === 'GRID' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate by ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5">
              {(['ALL', 'CRITICAL', 'SUSPICIOUS', 'CLEAR'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterThreat(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    filterThreat === lvl
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Candidates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredExaminees.map((ex) => (
              <div
                key={ex.id}
                onClick={() => inspectExamineeBundle(ex.id, ex.name)}
                className={`glass-panel p-4 rounded-xl border transition-all cursor-pointer hover:border-cyan-500/50 space-y-3 ${
                  ex.threatLevel === 'CRITICAL'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : ex.threatLevel === 'SUSPICIOUS'
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400">{ex.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      ex.threatLevel === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : ex.threatLevel === 'SUSPICIOUS'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {ex.threatLevel} ({ex.riskScore}%)
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white line-clamp-1">{ex.name}</h3>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 space-y-0.5">
                    <div>• Gaze: <span className="text-slate-200">{ex.gazeStatus}</span></div>
                    <div>• Audio: <span className="text-slate-200">{ex.audioStatus}</span></div>
                    <div>• Typing: <span className="text-slate-200">{ex.keystrokeStatus}</span></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                  <span>Inspect Evidence Bundle</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: DEBERTA COLLUSION NETWORK GRAPH & SIMILARITY MATRIX */}
      {viewMode === 'COLLUSION_GRAPH' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-rose-400" />
                  <span>DeBERTa-v3 Answer Similarity Matrix & Collusion Cluster Graph</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Transformer embedding vector search across concurrent submissions flagging pairs with &gt; 85% similarity.
                </p>
              </div>
              <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full text-xs font-mono font-bold">
                1 COLLUSION CLUSTER FLAGGED
              </span>
            </div>

            {/* Interactive Network Graph Visualizer */}
            <div className="h-64 bg-slate-950 rounded-xl border border-slate-800 p-4 relative flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 600 200">
                {/* Connections */}
                <line x1="150" y1="100" x2="300" y2="60" stroke="#ff1744" strokeWidth="2.5" strokeDasharray="4" className="animate-pulse" />
                <line x1="300" y1="60" x2="450" y2="120" stroke="#ffab00" strokeWidth="1.5" />
                <line x1="150" y1="100" x2="220" y2="160" stroke="#00f2fe" strokeWidth="1" />

                {/* Nodes */}
                <g transform="translate(150, 100)" className="cursor-pointer" onClick={() => inspectExamineeBundle('EX-2004', 'Alex Rivera')}>
                  <circle r="22" fill="#121824" stroke="#ff1744" strokeWidth="3" />
                  <text textAnchor="middle" dy="4" fill="#ff1744" fontSize="10" fontFamily="monospace" fontWeight="bold">EX-2004</text>
                  <text textAnchor="middle" dy="34" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">Alex Rivera</text>
                </g>

                <g transform="translate(300, 60)" className="cursor-pointer" onClick={() => inspectExamineeBundle('EX-2012', 'Sophia Zhang')}>
                  <circle r="22" fill="#121824" stroke="#ff1744" strokeWidth="3" />
                  <text textAnchor="middle" dy="4" fill="#ff1744" fontSize="10" fontFamily="monospace" fontWeight="bold">EX-2012</text>
                  <text textAnchor="middle" dy="34" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">Sophia Zhang</text>
                </g>

                <g transform="translate(450, 120)" className="cursor-pointer">
                  <circle r="18" fill="#121824" stroke="#ffab00" strokeWidth="2" />
                  <text textAnchor="middle" dy="4" fill="#ffab00" fontSize="9" fontFamily="monospace">EX-2029</text>
                  <text textAnchor="middle" dy="30" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">Marcus Vance</text>
                </g>

                {/* Edge Label */}
                <rect x="200" y="65" width="50" height="18" rx="4" fill="#0f172a" stroke="#ff1744" strokeWidth="1" />
                <text x="225" y="77" textAnchor="middle" fill="#ff1744" fontSize="9" fontFamily="monospace" fontWeight="bold">94.2%</text>
              </svg>
            </div>

            {/* Pairwise Collusion Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Flagged Collusion Pairs</h3>
              <div className="p-4 bg-slate-950 rounded-xl border border-rose-500/30 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold">
                    <span className="text-rose-400">Alex Rivera (EX-2004)</span>
                    <span className="text-slate-500">&lt;--&gt;</span>
                    <span className="text-rose-400">Sophia Zhang (EX-2012)</span>
                  </div>
                  <p className="text-xs text-slate-300">Question Q-ESSAY-02: Raft Leader Election & Heartbeat Timeouts</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-extrabold text-rose-400 font-mono">94.2%</span>
                  <button
                    onClick={() => inspectExamineeBundle('EX-2004', 'Alex Rivera')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold hover:bg-rose-500/30"
                  >
                    View Diff
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCE BUNDLE MODAL */}
      <EvidenceBundleModal bundle={activeBundle} onClose={() => setActiveBundle(null)} />
    </div>
  );
};
