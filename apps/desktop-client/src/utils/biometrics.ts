import { ExamineeProfile, ThreatLevel, ViolationEvent, DeBERTaSimilarityMatch, EvidenceBundle } from '../types/proctor';

// 1. Keystroke Dynamics Distance Metric
export function evaluateKeystrokeDynamics(
  currentDwellMs: number,
  currentFlightMs: number,
  baselineDwellMs: number,
  baselineFlightMs: number
): { score: number; isAnomaly: boolean } {
  const dwellDiff = Math.abs(currentDwellMs - baselineDwellMs) / (baselineDwellMs + 1);
  const flightDiff = Math.abs(currentFlightMs - baselineFlightMs) / (baselineFlightMs + 1);

  const rawScore = dwellDiff * 0.6 + flightDiff * 0.4;
  const score = Math.min(1.0, Math.max(0.0, rawScore));
  const isAnomaly = score > 0.45;

  return { score, isAnomaly };
}

// 2. Gaze Vector Angle Projection
export function computeGazeDirection(yawDeg: number, pitchDeg: number): {
  target: string;
  isStray: boolean;
  color: string;
} {
  const absYaw = Math.abs(yawDeg);
  const absPitch = Math.abs(pitchDeg);

  if (absYaw > 25) {
    const dir = yawDeg > 0 ? 'RIGHT OFF-SCREEN' : 'LEFT OFF-SCREEN';
    return { target: `LOOKING ${dir}`, isStray: true, color: 'text-amber-400' };
  }
  if (pitchDeg < -20) {
    return { target: 'LOOKING DOWN (DESK / PHONE)', isStray: true, color: 'text-rose-400' };
  }
  if (pitchDeg > 20) {
    return { target: 'LOOKING UP (CEILING)', isStray: true, color: 'text-amber-400' };
  }

  return { target: 'CENTER SCREEN (FOCUSED)', isStray: false, color: 'text-emerald-400' };
}

// 3. Audio Whisper & Pitch Analyzer
export function analyzeAudioSpectrum(fftBins: number[], enrolledPitchHz: number): {
  isSpeech: boolean;
  isWhisper: boolean;
  isSecondSpeaker: boolean;
  detectedPitchHz: number;
} {
  const sum = fftBins.reduce((a, b) => a + b, 0);
  const avg = sum / (fftBins.length || 1);
  const isSpeech = avg > 12;

  // Whisper ratio (bins 2-8 ratio vs high bins)
  const lowBinsEnergy = fftBins.slice(2, 8).reduce((a, b) => a + b, 0);
  const whisperRatio = lowBinsEnergy / (sum + 1e-5);
  const isWhisper = isSpeech && whisperRatio > 0.65 && avg < 30;

  // Pitch calculation
  const maxIdx = fftBins.indexOf(Math.max(...fftBins));
  const detectedPitchHz = Math.round(maxIdx * 45 + 90);
  const pitchDelta = Math.abs(detectedPitchHz - enrolledPitchHz);
  const isSecondSpeaker = isSpeech && !isWhisper && pitchDelta > 75;

  return { isSpeech, isWhisper, isSecondSpeaker, detectedPitchHz };
}

// 4. SHA-256 Hash Generator for Cryptographic Audit Trail
export async function generateAuditHash(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + Date.now().toString());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 5. Mock Session Generator for 1,000+ Concurrent Candidates Grid
export function generateMockExamineeGrid(count: number = 100): {
  id: string;
  name: string;
  threatLevel: ThreatLevel;
  riskScore: number;
  gazeStatus: string;
  audioStatus: string;
  keystrokeStatus: string;
  lastActiveSec: number;
}[] {
  const names = [
    "Alex Rivera", "Sophia Zhang", "Marcus Vance", "Elena Rostova", "David Chen",
    "Priya Sharma", "Lucas Moretti", "Aaliyah Khan", "Liam O'Connor", "Chloe Dubois",
    "Yusuf Demir", "Hannah Miller", "Gabriel Silva", "Zoe Kowalski", "Kenji Sato"
  ];

  const grid = [];
  for (let i = 1; i <= count; i++) {
    const name = names[(i - 1) % names.length] + ` (#${1000 + i})`;
    const rand = Math.random();
    let threatLevel: ThreatLevel = 'CLEAR';
    let riskScore = Math.round(rand * 25);
    let gazeStatus = 'CENTER SCREEN';
    let audioStatus = 'SILENT';
    let keystrokeStatus = 'NORMAL DYNAMICS';

    if (i === 4 || i === 12 || i === 29) {
      threatLevel = 'CRITICAL';
      riskScore = 88 + Math.floor(Math.random() * 10);
      gazeStatus = 'DESK / SECOND SCREEN';
      audioStatus = 'SECOND SPEAKER DETECTED';
      keystrokeStatus = 'IMPOSTER TYPING SPEED';
    } else if (i % 7 === 0) {
      threatLevel = 'SUSPICIOUS';
      riskScore = 45 + Math.floor(Math.random() * 20);
      gazeStatus = 'OFF-SCREEN YAW (+34°)';
      audioStatus = 'WHISPER FREQUENCY MATCH';
      keystrokeStatus = 'HIGH DWELL VARIANCE';
    }

    grid.push({
      id: `EX-${2000 + i}`,
      name,
      threatLevel,
      riskScore,
      gazeStatus,
      audioStatus,
      keystrokeStatus,
      lastActiveSec: Math.floor(Math.random() * 4),
    });
  }

  return grid;
}

// 6. Pre-filled Evidence Bundle Generator for Reviewer Modal
export function getMockEvidenceBundle(examineeId: string, examineeName: string): EvidenceBundle {
  return {
    examineeId,
    examineeName,
    sessionID: `SESS-${examineeId}-2026-X9`,
    examName: "CS-401: Advanced Distributed Systems & Cryptography",
    date: "2026-09-02T10:30:00Z",
    totalViolations: 5,
    overallThreatLevel: "CRITICAL",
    gazeHeatmapData: [
      { x: 50, y: 45, count: 120 }, // Center
      { x: 88, y: 20, count: 42 },  // Right Offscreen
      { x: 50, y: 92, count: 68 },  // Down at desk/phone
    ],
    audioSpectrumData: [
      { freqHz: 100, dB: -42 },
      { freqHz: 250, dB: -18 }, // Whisper peak
      { freqHz: 500, dB: -12 }, // Second speaker pitch
      { freqHz: 1000, dB: -35 },
      { freqHz: 2000, dB: -50 },
    ],
    keystrokeGraphPoints: [
      { time: 10, dwellMs: 110, flightMs: 140, isAnomaly: false },
      { time: 20, dwellMs: 112, flightMs: 138, isAnomaly: false },
      { time: 30, dwellMs: 45, flightMs: 25, isAnomaly: true }, // Paste or macro bot
      { time: 40, dwellMs: 42, flightMs: 20, isAnomaly: true },
      { time: 50, dwellMs: 108, flightMs: 142, isAnomaly: false },
    ],
    events: [
      {
        id: "EVT-801",
        examineeId,
        examineeName,
        timestampMs: Date.now() - 600000,
        formattedTime: "10:15:22",
        type: "GAZE_STRAY",
        severity: "MEDIUM",
        description: "Gaze vector shifted to desk location (Pitch: -28.4°, Yaw: +4.2°) for > 12 seconds.",
        metrics: { gazeYaw: 4.2, gazePitch: -28.4 },
      },
      {
        id: "EVT-802",
        examineeId,
        examineeName,
        timestampMs: Date.now() - 420000,
        formattedTime: "10:18:40",
        type: "AUDIO_WHISPER",
        severity: "MEDIUM",
        description: "Spectral whisper energy detected in 200-800Hz frequency band.",
        metrics: { audioEnergy: 0.42 },
      },
      {
        id: "EVT-803",
        examineeId,
        examineeName,
        timestampMs: Date.now() - 280000,
        formattedTime: "10:21:05",
        type: "SECOND_SPEAKER",
        severity: "HIGH",
        description: "Secondary voiceprint identified (Pitch shift: +94Hz vs enrolled baseline).",
        metrics: { pitchDeltaHz: 94 },
      },
      {
        id: "EVT-804",
        examineeId,
        examineeName,
        timestampMs: Date.now() - 150000,
        formattedTime: "10:23:18",
        type: "COLLUSION_MATCH",
        severity: "CRITICAL",
        description: "DeBERTa-v3 NLP similarity score 94.2% matching concurrent Examinee EX-2012 (Sophia Zhang).",
        metrics: { similarityScore: 0.942 },
      },
    ],
    debertaMatches: [
      {
        examineeAId: examineeId,
        examineeAName: examineeName,
        examineeBId: "EX-2012",
        examineeBName: "Sophia Zhang",
        questionId: "Q-ESSAY-02",
        questionTitle: "Raft Consensus Protocol & Partition Tolerance",
        similarityScore: 0.942,
        snippetA: "In Raft, leader election relies on randomized heartbeat timers. If a follower receives no heartbeat, it increments term and transitions to candidate...",
        snippetB: "Raft consensus leader election uses randomized heartbeat timeouts. When followers receive no heartbeat, they increment term counter and become candidates...",
        isCollusionFlagged: true,
      },
    ],
    sha256AuditHash: "0xa8f921b7c4d93e10842f1a9e34c2b87e614d99fa1b02348576e0129a34bc8f9e",
    downloadUrl: "#export-pdf-bundle",
  };
}
