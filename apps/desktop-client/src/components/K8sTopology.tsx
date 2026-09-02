import React, { useState } from 'react';
import { Server, Cpu, Database, Network, ShieldCheck, Zap, ArrowUpRight, Activity } from 'lucide-react';

export const K8sTopology: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState(1048);
  const [isHighLoad, setIsHighLoad] = useState(true);

  // Dynamic Pod Counts
  const authPods = isHighLoad ? 12 : 3;
  const proctoringPods = isHighLoad ? 36 : 10;
  const nlpPods = isHighLoad ? 10 : 2;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Server className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">Kubernetes Microservices Architecture</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Production Topology & Horizontal Pod Autoscaler (HPA) scaling to 1,000+ simultaneous proctoring sessions.
          </p>
        </div>

        {/* Load Control */}
        <div className="flex items-center space-x-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Simulated Load</span>
            <span className="text-sm font-extrabold text-cyan-400 font-mono">{activeSessions} Active Candidates</span>
          </div>
          <button
            onClick={() => {
              setIsHighLoad(!isHighLoad);
              setActiveSessions(isHighLoad ? 120 : 1048);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
              isHighLoad ? 'bg-rose-500 text-white shadow-lg' : 'bg-cyan-500 text-slate-950'
            }`}
          >
            {isHighLoad ? 'Simulate 1,000+ Peak Load' : 'Normal Idle Load'}
          </button>
        </div>
      </div>

      {/* Cluster Topology Visualizer */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        {/* Row 1: Ingress Layer */}
        <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Network className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white font-mono">NGINX Ingress Controller (TLS &amp; WebSocket Upgrade)</h3>
              <p className="text-xs text-slate-400 font-mono">Rate Limit: 10,000 RPS | WebSocket Keep-Alive | TLS 1.3 Termination</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded bg-cyan-950 text-cyan-400 text-xs font-mono font-bold border border-cyan-800">
            LOAD BALANCED
          </span>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="w-0.5 h-6 bg-cyan-500/50" />
        </div>

        {/* Row 2: Microservice Deployments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Service 1: Auth & Biometrics */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">auth-biometrics-service</h4>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">{authPods} Pods</span>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              Multi-factor face embedding, voiceprint acoustic MFCC, and Win32 hardware PnP driver verification.
            </p>

            {/* Pod Grid */}
            <div className="grid grid-cols-4 gap-1.5 pt-2">
              {Array.from({ length: authPods }).map((_, i) => (
                <div key={i} className="p-2 bg-slate-900 rounded border border-emerald-500/40 text-center">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                  <span className="text-[9px] font-mono text-slate-400 block mt-1">pod-{i + 1}</span>
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
              HPA Scale: 3 min --&gt; 20 max (Target CPU 70%)
            </div>
          </div>

          {/* Service 2: Proctoring Engine (WebSockets) */}
          <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/40 shadow-lg shadow-cyan-500/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h4 className="font-bold text-sm text-white">proctoring-engine-service</h4>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">{proctoringPods} Pods</span>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              High-throughput WebSocket telemetry ingestion. Temporal decay anomaly fusion scorer.
            </p>

            {/* Pod Grid */}
            <div className="grid grid-cols-6 gap-1.5 pt-2">
              {Array.from({ length: proctoringPods }).map((_, i) => (
                <div key={i} className="p-1.5 bg-slate-900 rounded border border-cyan-500/40 text-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mx-auto animate-ping" />
                  <span className="text-[8px] font-mono text-slate-400 block mt-0.5">{i + 1}</span>
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono text-cyan-400 font-bold pt-2 border-t border-slate-800">
              HPA Active: Scaled to {proctoringPods} Pods for 1,000+ sessions
            </div>
          </div>

          {/* Service 3: AI DeBERTa NLP Similarity */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-rose-400" />
                <h4 className="font-bold text-sm text-white">nlp-similarity-service</h4>
              </div>
              <span className="text-xs font-mono text-rose-400 font-bold">{nlpPods} GPU Pods</span>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              NVIDIA TensorRT GPU pool running DeBERTa-v3 sentence embeddings & FAISS similarity indexing.
            </p>

            {/* Pod Grid */}
            <div className="grid grid-cols-4 gap-1.5 pt-2">
              {Array.from({ length: nlpPods }).map((_, i) => (
                <div key={i} className="p-2 bg-slate-900 rounded border border-rose-500/40 text-center">
                  <Cpu className="w-3.5 h-3.5 text-rose-400 mx-auto" />
                  <span className="text-[9px] font-mono text-slate-400 block mt-1">gpu-{i + 1}</span>
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
              GPU Pool Node Selector: nvidia.com/gpu: 1
            </div>
          </div>
        </div>

        {/* Row 3: Infrastructure Layer (Kafka, Redis, TimescaleDB, MinIO, LiveKit) */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Data &amp; Event Streaming Infrastructure Layer</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center space-x-3">
              <Database className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-white block">Apache Kafka</span>
                <span className="text-[10px] font-mono text-slate-400">KRaft Broker (4 Topics)</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center space-x-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-white block">Redis 7 Cluster</span>
                <span className="text-[10px] font-mono text-slate-400">Telemetry Pub/Sub &amp; State</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center space-x-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">TimescaleDB</span>
                <span className="text-[10px] font-mono text-slate-400">Immutable Audit Logs</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center space-x-3">
              <Network className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-white block">LiveKit SFU</span>
                <span className="text-[10px] font-mono text-slate-400">WebRTC Video/Audio Bus</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
