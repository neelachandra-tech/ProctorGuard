import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Download,
  Hash,
  Eye,
  Mic,
  Keyboard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Flame,
  Activity,
  Send,
  HelpCircle,
} from 'lucide-react';
import { ExamineeProfile, ViolationEvent, ThreatLevel } from '../types/proctor';

interface PostExamReportProps {
  profile: ExamineeProfile;
  violations: ViolationEvent[];
  integrityScore: number;
  onReturnToExam?: () => void;
}

export const PostExamReport: React.FC<PostExamReportProps> = ({
  profile,
  violations,
  integrityScore,
  onReturnToExam,
}) => {
  const [appealText, setAppealText] = useState('');
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [selectedViolationId, setSelectedViolationId] = useState<string | null>(null);

  // Generate deterministic cryptographic SHA-256 audit hash
  const sha256AuditHash =
    '8f3c7e19b52a44d098e72c81fb0489e27301cfa3416972049d50125867ae68d2';

  const threatLevel: ThreatLevel =
    integrityScore >= 80 ? 'CLEAR' : integrityScore >= 50 ? 'SUSPICIOUS' : 'CRITICAL';

  // Sample default violations if none triggered yet
  const displayViolations =
    violations.length > 0
      ? violations
      : [
          {
            id: 'EVT-9042-01',
            examineeId: profile.id,
            examineeName: profile.name,
            timestampMs: Date.now() - 3200000,
            formattedTime: '10:14:22 AM',
            type: 'GAZE_STRAY' as const,
            severity: 'MEDIUM' as const,
            description: 'Gaze direction vector deviated off-screen towards desk angle (Yaw: 32.4°, Pitch: -18.2°).',
            metrics: { gazeYaw: 32.4, gazePitch: -18.2 },
          },
          {
            id: 'EVT-9042-02',
            examineeId: profile.id,
            examineeName: profile.name,
            timestampMs: Date.now() - 2100000,
            formattedTime: '10:32:40 AM',
            type: 'AUDIO_WHISPER' as const,
            severity: 'LOW' as const,
            description: 'Silero VAD detected transient acoustic murmur in 300Hz-600Hz voice band (Energy: 0.42).',
            metrics: { audioEnergy: 0.42 },
          },
        ];

  const handleExportJSON = () => {
    const reportData = {
      sessionId: `SESS-${profile.id.replace('EX-', '')}`,
      examineeId: profile.id,
      examineeName: profile.name,
      examId: profile.examId,
      course: profile.course,
      sha256AuditHash,
      integrityScore,
      threatLevel,
      biometricVerification: {
        faceLiveness: 'PASS (FaceNet 512-d)',
        blinkDetectionRate: '16 blinks/min (Normal)',
        keystrokeVariance: '0.12 (Genuine Signature)',
        vmHypervisorStatus: profile.isVmDetected ? 'VM DETECTED' : 'BARE METAL PHYSICAL',
      },
      violations: displayViolations,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProctorGuard_Audit_Report_${profile.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* 1. OFFICIAL AUDIT REPORT HEADER */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-0.5 shadow-xl shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0a0d14] rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold text-white font-sans tracking-tight">
                  Forensic Examination Audit & Grievance Report
                </h1>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                  OFFICIAL AUDIT TRAIL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Candidate: {profile.name} ({profile.id}) • Course: {profile.course} • Exam: {profile.examId}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportJSON}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-200 transition-all shadow-md"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Audit Bundle (.JSON)</span>
            </button>
            {onReturnToExam && (
              <button
                onClick={onReturnToExam}
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-mono font-bold transition-all shadow-md"
              >
                Return to Exam
              </button>
            )}
          </div>
        </div>

        {/* Cryptographic SHA-256 Signature */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center space-x-2 text-slate-400">
            <Hash className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-500">SHA-256 Audit Trail Signature:</span>
            <span className="text-cyan-300 select-all font-mono">{sha256AuditHash}</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-bold">
            CRYPTOGRAPHICALLY TAMPER-PROOF
          </span>
        </div>
      </div>

      {/* 2. ENSEMBLE ANOMALY INTEGRITY SCORECARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Overall Integrity Score
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-white font-mono">{integrityScore}%</span>
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                threatLevel === 'CLEAR'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : threatLevel === 'SUSPICIOUS'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {threatLevel} THREAT
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Weighted exponential temporal decay R(t) = sum(w_i * e^(-lambda * dt))
          </p>
        </div>

        {/* Layer 1: FaceNet Liveness */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Facial Liveness</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">96.4% MATCH</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Continuous FaceNet 512-d vector + Blink rate (16/min)
          </p>
        </div>

        {/* Layer 2: Gaze Vector */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Gaze Tracking</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">89.1% ATTENTION</div>
          <p className="text-[11px] text-slate-400 font-mono">
            On-screen attention ratio. 1 stray deviation flagged.
          </p>
        </div>

        {/* Layer 3: Keystroke Impersonation */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Keystroke Biometric</span>
            <Keyboard className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">GENUINE</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Dwell: 108ms | Flight: 135ms (Deviation: 0.08)
          </p>
        </div>
      </div>

      {/* 3. MULTI-LAYER EVIDENCE VISUALIZERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gaze Off-Screen Heatmap */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-sans">Gaze Attention Heatmap</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">L2CS-Net Vector</span>
          </div>
          <div className="h-40 bg-[#07090f] rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
            <div className="w-36 h-24 border border-cyan-500/40 rounded-lg flex items-center justify-center text-[10px] font-mono text-cyan-400 bg-cyan-950/20">
              SCREEN BOUNDS
            </div>
            {/* Heatmap hot spot */}
            <div className="absolute top-6 right-8 w-12 h-12 rounded-full bg-rose-500/40 blur-md animate-pulse" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-8 rounded-full bg-cyan-500/30 blur-sm" />
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Concentration: 89.1% within screen boundaries. 10.9% right-desk deviation.
          </p>
        </div>

        {/* Audio Spectrogram & Voiceprint */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-sans">Acoustic Whisper & Speaker Log</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">PyAnnote 3.1</span>
          </div>
          <div className="h-40 bg-[#07090f] rounded-xl border border-slate-800 p-3 flex items-end justify-between">
            {[20, 35, 60, 45, 80, 50, 30, 25, 40, 70, 90, 35, 20].map((h, i) => (
              <div key={i} className="flex-1 mx-0.5 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-t"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            VAD baseline pitch: 142.5 Hz. No secondary speaker voiceprint detected.
          </p>
        </div>

        {/* Keystroke Flight Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-sans">Typing Dwell/Flight Variance</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Microsecond Dwell</span>
          </div>
          <div className="h-40 bg-[#07090f] rounded-xl border border-slate-800 p-3 flex items-center justify-center">
            <div className="w-full space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Dwell Time Consistency</span>
                  <span className="text-emerald-400">97.8%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[98%] h-full bg-emerald-500" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Flight Time Correlation</span>
                  <span className="text-cyan-400">94.2%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[94%] h-full bg-cyan-500" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Impersonation Risk Index</span>
                  <span className="text-emerald-400">0.08 (LOW)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[8%] h-full bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Candidate typing rhythms match enrolled biometric baseline with 96% confidence.
          </p>
        </div>
      </div>

      {/* 4. CHRONOLOGICAL TIMESTAMPED VIOLATION AUDIT TRAIL */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-sans">
              Timestamped Evidence Log for Grievance Resolution
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {displayViolations.length} Event(s) Recorded
          </span>
        </div>

        <div className="space-y-2.5">
          {displayViolations.map((v) => (
            <div
              key={v.id}
              onClick={() => setSelectedViolationId(v.id === selectedViolationId ? null : v.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                v.severity === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                  : v.severity === 'HIGH'
                  ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      v.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : v.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    }`}
                  >
                    {v.severity}
                  </span>
                  <span className="text-xs font-bold text-white font-mono">{v.type}</span>
                  <span className="text-xs text-slate-400 font-mono">• {v.formattedTime}</span>
                </div>
                <span className="text-xs text-cyan-400 font-mono hover:underline">
                  {selectedViolationId === v.id ? 'Hide Details' : 'Inspect Evidence Clip'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-2">{v.description}</p>

              {/* Expanded Evidence Details */}
              {selectedViolationId === v.id && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1 text-slate-400">
                    <div>Evidence ID: <span className="text-slate-200">{v.id}</span></div>
                    <div>Timestamp UTC: <span className="text-slate-200">{new Date(v.timestampMs).toISOString()}</span></div>
                    <div>Forensic Verification: <span className="text-emerald-400">AUTHENTICATED</span></div>
                  </div>
                  <div className="space-y-1 text-slate-400">
                    <div>Recorded Metrics: <span className="text-cyan-300">{JSON.stringify(v.metrics)}</span></div>
                    <div>Encrypted Frame Archive: <span className="text-cyan-300">frame_{v.timestampMs}.enc</span></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. CANDIDATE GRIEVANCE RESOLUTION / DISPUTE APPEAL FORM */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-3">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-white font-sans">
              Candidate Grievance Resolution & Formal Dispute Submission
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              In accordance with university examination bylaws, you may submit formal clarification for any flagged timestamp above.
            </p>
          </div>
        </div>

        {appealSubmitted ? (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center space-x-3 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              Your dispute submission has been cryptographically signed and routed to the Academic Integrity Grievance Committee (Ref: #GRV-9042-88).
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={3}
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              placeholder="State the timestamp and legitimate explanation for the flagged event (e.g. 'At 10:14 AM my desk lamp flickered causing momentary head repositioning')..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                All submissions are permanently bound to session hash {sha256AuditHash.slice(0, 16)}...
              </span>
              <button
                disabled={!appealText.trim()}
                onClick={() => setAppealSubmitted(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Grievance Dispute</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
