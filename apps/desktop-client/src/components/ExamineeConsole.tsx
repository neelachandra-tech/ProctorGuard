import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Eye, Mic, Keyboard, AlertTriangle, Save, Clock, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { ExamineeProfile, ExamQuestion, ThreatLevel, ViolationEvent } from '../types/proctor';
import { computeGazeDirection, analyzeAudioSpectrum, evaluateKeystrokeDynamics } from '../utils/biometrics';

interface ExamineeConsoleProps {
  profile: ExamineeProfile;
  onViolationTriggered: (evt: ViolationEvent) => void;
}

export const ExamineeConsole: React.FC<ExamineeConsoleProps> = ({ profile, onViolationTriggered }) => {
  // Questions State
  const [questions, setQuestions] = useState<ExamQuestion[]>([
    {
      id: 'Q-01',
      title: 'Distributed System Consensus & Fault Tolerance',
      type: 'MULTIPLE_CHOICE',
      prompt: 'Which of the following properties is guaranteed by the Raft consensus algorithm during network partitions?',
      options: [
        'A. Both partitions can continue electing leaders independently.',
        'B. Only the partition containing a strict majority of nodes can elect a leader and commit logs.',
        'C. Split-brain scenario occurs automatically to maintain write availability.',
        'D. Writes are accepted without leader validation during partitions.'
      ],
      userAnswer: 'B. Only the partition containing a strict majority of nodes can elect a leader and commit logs.'
    },
    {
      id: 'Q-02',
      title: 'Raft Consensus Protocol & Partition Tolerance',
      type: 'ESSAY',
      prompt: 'Explain the leader election phase in the Raft consensus protocol. Highlight how randomized heartbeat timeouts prevent split votes and how terms maintain state ordering.',
      userAnswer: 'In Raft, leader election relies on randomized heartbeat timers. If a follower receives no heartbeat within its randomized election timeout, it increments its term counter, transitions to the candidate state, votes for itself, and broadcasts RequestVote RPCs to all peers. When a majority of nodes grant their vote, the candidate becomes leader.',
      wordCount: 54
    },
    {
      id: 'Q-03',
      title: 'BFT & Byzantine Vector Commitments',
      type: 'SHORT_ANSWER',
      prompt: 'Define the maximum ratio of malicious Byzantine nodes ($f$) that a Practical Byzantine Fault Tolerant (PBFT) cluster of $N$ nodes can tolerate.',
      userAnswer: 'A PBFT system requires N >= 3f + 1 total nodes, so it can tolerate up to f < N/3 Byzantine malicious failures.',
      wordCount: 22
    }
  ]);

  const [activeQIndex, setActiveQIndex] = useState(0);

  // Security Telemetry State
  const [gazeYaw, setGazeYaw] = useState(2.1);
  const [gazePitch, setGazePitch] = useState(-1.4);
  const [reauthSimilarity, setReauthSimilarity] = useState(0.96);
  const [audioLevel, setAudioLevel] = useState(12);
  const [isWhispering, setIsWhispering] = useState(false);
  const [isSecondSpeaker, setIsSecondSpeaker] = useState(false);
  const [keystrokeAnomalyScore, setKeystrokeAnomalyScore] = useState(0.08);

  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('CLEAR');
  const [timerSec, setTimerSec] = useState(5400); // 90 min timer
  const [lastAutoSave, setLastAutoSave] = useState('10:28:40 AM');

  // Keystroke dynamics tracking
  const keyTimesRef = useRef<Record<string, number>>({});
  const [typingDwell, setTypingDwell] = useState<number[]>([]);

  // Continuous Telemetry Loop
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimerSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Format timer
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentGaze = computeGazeDirection(gazeYaw, gazePitch);

  // Anomaly Simulators
  const triggerGazeStraySim = () => {
    setGazeYaw(34.2);
    setGazePitch(-24.5);
    setThreatLevel('SUSPICIOUS');
    const evt: ViolationEvent = {
      id: `EVT-${Date.now()}`,
      examineeId: profile.id,
      examineeName: profile.name,
      timestampMs: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      type: 'GAZE_STRAY',
      severity: 'MEDIUM',
      description: 'Gaze direction vector strayed off-screen towards desk location for > 8 seconds.',
      metrics: { gazeYaw: 34.2, gazePitch: -24.5 }
    };
    onViolationTriggered(evt);
  };

  const triggerWhisperSim = () => {
    setIsWhispering(true);
    setAudioLevel(48);
    setThreatLevel('SUSPICIOUS');
    const evt: ViolationEvent = {
      id: `EVT-${Date.now()}`,
      examineeId: profile.id,
      examineeName: profile.name,
      timestampMs: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      type: 'AUDIO_WHISPER',
      severity: 'MEDIUM',
      description: 'Audio spectral analysis detected whispered speech in 200Hz - 800Hz energy band.',
      metrics: { audioEnergy: 0.68 }
    };
    onViolationTriggered(evt);
  };

  const triggerSecondSpeakerSim = () => {
    setIsSecondSpeaker(true);
    setAudioLevel(72);
    setThreatLevel('CRITICAL');
    const evt: ViolationEvent = {
      id: `EVT-${Date.now()}`,
      examineeId: profile.id,
      examineeName: profile.name,
      timestampMs: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      type: 'SECOND_SPEAKER',
      severity: 'HIGH',
      description: 'PyAnnote.audio speaker diarization identified a secondary voiceprint (+94Hz pitch delta).',
      metrics: { pitchDeltaHz: 94 }
    };
    onViolationTriggered(evt);
  };

  const triggerKeystrokeImposterSim = () => {
    setKeystrokeAnomalyScore(0.88);
    setThreatLevel('CRITICAL');
    const evt: ViolationEvent = {
      id: `EVT-${Date.now()}`,
      examineeId: profile.id,
      examineeName: profile.name,
      timestampMs: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      type: 'KEYBOARD_ANOMALY',
      severity: 'CRITICAL',
      description: 'Keystroke dynamics dwell/flight-time variance deviated significantly from enrolled signature (Distance: 0.88).',
      metrics: { keystrokeAnomalyScore: 0.88 }
    };
    onViolationTriggered(evt);
  };

  const resetTelemetry = () => {
    setGazeYaw(1.2);
    setGazePitch(-0.8);
    setReauthSimilarity(0.96);
    setAudioLevel(12);
    setIsWhispering(false);
    setIsSecondSpeaker(false);
    setKeystrokeAnomalyScore(0.08);
    setThreatLevel('CLEAR');
  };

  const currentQ = questions[activeQIndex];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* 1. TOP LIVE SECURITY TELEMETRY HEADER */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Examinee Meta & Timer */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 font-mono">
              EX
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">{profile.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {profile.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">CS-401 Distributed Systems Exam</p>
            </div>
          </div>

          {/* Time Remaining */}
          <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Time Remaining</span>
              <span className="text-base font-extrabold text-white font-mono">{formatTime(timerSec)}</span>
            </div>
          </div>

          {/* Overall Threat Status Pill */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400">System Threat:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold font-mono tracking-wider ${
                threatLevel === 'CLEAR'
                  ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400'
                  : threatLevel === 'SUSPICIOUS'
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400'
                  : 'bg-rose-500/10 border border-rose-500/40 text-rose-400 animate-pulse'
              }`}
            >
              ● {threatLevel}
            </span>
          </div>
        </div>

        {/* Real-time Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          {/* Gaze Estimator */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${currentGaze.isStray ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Gaze Estimation</span>
              <span className={`text-xs font-bold font-mono ${currentGaze.color}`}>{currentGaze.target}</span>
              <div className="text-[10px] font-mono text-slate-500">Yaw: {gazeYaw}° | Pitch: {gazePitch}°</div>
            </div>
          </div>

          {/* Face Re-Auth */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Face Re-Auth (FaceNet)</span>
              <span className="text-xs font-bold font-mono text-emerald-400">
                {Math.round(reauthSimilarity * 100)}% MATCH
              </span>
              <div className="text-[10px] font-mono text-slate-500">Continuous 512-d Check</div>
            </div>
          </div>

          {/* Audio Spectrum / Whisper */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isSecondSpeaker ? 'bg-rose-500/20 text-rose-400' : isWhispering ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Audio Analyzer</span>
              <span className={`text-xs font-bold font-mono ${isSecondSpeaker ? 'text-rose-400' : isWhispering ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isSecondSpeaker ? '2ND SPEAKER DETECTED' : isWhispering ? 'WHISPER FREQ MATCH' : 'SILENT / ENROLLED VOICE'}
              </span>
              <div className="text-[10px] font-mono text-slate-500">FFT Level: {audioLevel} dB</div>
            </div>
          </div>

          {/* Keystroke Dynamics */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${keystrokeAnomalyScore > 0.45 ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Keystroke Dynamics</span>
              <span className={`text-xs font-bold font-mono ${keystrokeAnomalyScore > 0.45 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {keystrokeAnomalyScore > 0.45 ? 'IMPOSTER TYPING' : 'GENUINE SIGNATURE'}
              </span>
              <div className="text-[10px] font-mono text-slate-500">Anomaly Dist: {keystrokeAnomalyScore.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN EXAM QUESTION & ANSWER PLAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Navigator */}
        <div className="lg:col-span-1 glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">Questions Navigator</div>
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setActiveQIndex(idx)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  activeQIndex === idx
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="text-[10px] font-mono text-cyan-400">{q.id} • {q.type}</div>
                  <div className="font-bold text-xs line-clamp-1">{q.title}</div>
                </div>
                {q.userAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Interactive Simulation Trigger Panel */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Security Anomaly Simulators</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={triggerGazeStraySim}
                className="w-full text-left px-2.5 py-1.5 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/50 rounded text-[11px] font-mono text-amber-300"
              >
                Simulate Gaze Stray (Off-Screen)
              </button>
              <button
                onClick={triggerWhisperSim}
                className="w-full text-left px-2.5 py-1.5 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/50 rounded text-[11px] font-mono text-amber-300"
              >
                Simulate Audio Whisper
              </button>
              <button
                onClick={triggerSecondSpeakerSim}
                className="w-full text-left px-2.5 py-1.5 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 rounded text-[11px] font-mono text-rose-300"
              >
                Simulate 2nd Speaker Voice
              </button>
              <button
                onClick={triggerKeystrokeImposterSim}
                className="w-full text-left px-2.5 py-1.5 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 rounded text-[11px] font-mono text-rose-300"
              >
                Simulate Imposter Keystrokes
              </button>
              <button
                onClick={resetTelemetry}
                className="w-full text-center px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-mono text-slate-300"
              >
                Reset Telemetry Normal
              </button>
            </div>
          </div>
        </div>

        {/* Right Active Question Interface */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase">{currentQ.id} • {currentQ.type}</span>
              <h2 className="text-xl font-bold text-white mt-1">{currentQ.title}</h2>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Telemetry Auto-Saved ({lastAutoSave})</span>
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 text-sm leading-relaxed font-sans">
            {currentQ.prompt}
          </div>

          {/* Answer Input */}
          {currentQ.type === 'MULTIPLE_CHOICE' && currentQ.options && (
            <div className="space-y-3">
              {currentQ.options.map((opt, oIdx) => (
                <label
                  key={oIdx}
                  className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    currentQ.userAnswer === opt
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQ.id}`}
                    checked={currentQ.userAnswer === opt}
                    onChange={() => {
                      const updated = [...questions];
                      updated[activeQIndex].userAnswer = opt;
                      setQuestions(updated);
                    }}
                    className="accent-cyan-400 w-4 h-4"
                  />
                  <span className="text-sm font-sans">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {(currentQ.type === 'ESSAY' || currentQ.type === 'SHORT_ANSWER') && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>Response Editor (DeBERTa Similarity Analyzed):</span>
                <span>Words: {currentQ.userAnswer ? currentQ.userAnswer.split(/\s+/).length : 0}</span>
              </div>
              <textarea
                value={currentQ.userAnswer || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = [...questions];
                  updated[activeQIndex].userAnswer = val;
                  setQuestions(updated);
                }}
                rows={7}
                placeholder="Write your detailed answer here..."
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          )}

          {/* Controls Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveQIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeQIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs disabled:opacity-40"
            >
              Previous Question
            </button>
            <button
              onClick={() => setActiveQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={activeQIndex === questions.length - 1}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-white shadow-lg shadow-cyan-500/20"
            >
              Next Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
