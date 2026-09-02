export type ThreatLevel = 'CLEAR' | 'SUSPICIOUS' | 'CRITICAL';

export interface FaceBiometricProfile {
  enrolledAt: number;
  embeddingVector512: number[];
  faceMeshLandmarksCount: number;
  yawPitchBaseline: { yaw: number; pitch: number };
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
}

export interface VoiceprintProfile {
  enrolledAt: number;
  pitchBaselineHz: number;
  spectralFingerprint: number[];
  audioSampleDurationSec: number;
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
}

export interface KeystrokeProfile {
  enrolledAt: number;
  averageDwellMs: number;
  averageFlightMs: number;
  sampleCount: number;
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
}

export interface ExamineeProfile {
  id: string;
  name: string;
  email: string;
  course: string;
  examId: string;
  face: FaceBiometricProfile;
  voice: VoiceprintProfile;
  keystroke: KeystrokeProfile;
  isVmDetected: boolean;
  pnpAudited: boolean;
}

export interface ViolationEvent {
  id: string;
  examineeId: string;
  examineeName: string;
  timestampMs: number;
  formattedTime: string;
  type: 'GAZE_STRAY' | 'AUDIO_WHISPER' | 'SECOND_SPEAKER' | 'FACE_MISMATCH' | 'KEYBOARD_ANOMALY' | 'COLLUSION_MATCH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  metrics: {
    gazeYaw?: number;
    gazePitch?: number;
    audioEnergy?: number;
    pitchDeltaHz?: number;
    similarityScore?: number;
    keystrokeAnomalyScore?: number;
  };
  clipUrl?: string;
}

export interface DeBERTaSimilarityMatch {
  examineeAId: string;
  examineeAName: string;
  examineeBId: string;
  examineeBName: string;
  questionId: string;
  questionTitle: string;
  similarityScore: number; // 0.0 to 1.0
  snippetA: string;
  snippetB: string;
  isCollusionFlagged: boolean;
}

export interface CollusionGraphNode {
  id: string;
  label: string;
  threatLevel: ThreatLevel;
  group: number;
}

export interface CollusionGraphEdge {
  source: string;
  target: string;
  similarity: number;
}

export interface EvidenceBundle {
  examineeId: string;
  examineeName: string;
  sessionID: string;
  examName: string;
  date: string;
  totalViolations: number;
  overallThreatLevel: ThreatLevel;
  gazeHeatmapData: { x: number; y: number; count: number }[];
  audioSpectrumData: { freqHz: number; dB: number }[];
  keystrokeGraphPoints: { time: number; dwellMs: number; flightMs: number; isAnomaly: boolean }[];
  events: ViolationEvent[];
  debertaMatches: DeBERTaSimilarityMatch[];
  sha256AuditHash: string;
  downloadUrl: string;
}

export interface ExamQuestion {
  id: string;
  title: string;
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY';
  prompt: string;
  options?: string[];
  userAnswer?: string;
  wordCount?: number;
}
