/**
 * ProctorGuard Examiner Portal API Client
 * Connects to Fusion Engine (:8081) and Gateway (:8080)
 */

import { EvidenceBundle } from '../types/proctor';

const FUSION_URL = 'http://localhost:8081';

export interface BackendAnomalyState {
  session_id: string;
  examinee_id: string;
  examinee_name: string;
  course: string;
  risk_score: number;
  threat_status: 'CLEAR' | 'SUSPICIOUS' | 'CRITICAL';
  last_update_ms: number;
  events: Array<{
    event_type: string;
    weight: number;
    description?: string;
    timestamp_ms: number;
  }>;
  interventions: Array<{
    action: string;
    reason: string;
    examiner_id: string;
    timestamp_ms: number;
  }>;
}

export async function fetchFusionStates(): Promise<BackendAnomalyState[]> {
  try {
    const res = await fetch(`${FUSION_URL}/api/v1/fusion/states`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.states || [];
  } catch {
    return [];
  }
}

export async function fetchEvidenceBundleFromBackend(sessionId: string): Promise<EvidenceBundle | null> {
  try {
    const res = await fetch(`${FUSION_URL}/api/v1/fusion/evidence?session_id=${encodeURIComponent(sessionId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      sessionID: data.session_id || sessionId,
      examineeId: data.examinee_id || 'EX-9042',
      examineeName: data.examinee_name || 'Alex Rivera',
      examName: 'CS-401 Distributed Systems Final',
      date: new Date(data.generated_at_ms || Date.now()).toLocaleDateString(),
      totalViolations: (data.events || []).length,
      overallThreatLevel: (data.threat_status as 'CLEAR' | 'SUSPICIOUS' | 'CRITICAL') || 'CLEAR',
      sha256AuditHash: data.integrity_hash_sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      downloadUrl: '#',
      events: (data.events || []).map((e: any, idx: number) => ({
        id: `EVT-${idx}`,
        examineeId: data.examinee_id || 'EX-9042',
        examineeName: data.examinee_name || 'Alex Rivera',
        timestampMs: e.timestamp_ms || Date.now(),
        formattedTime: new Date(e.timestamp_ms || Date.now()).toLocaleTimeString(),
        type: e.event_type || 'GAZE_STRAY',
        severity: e.weight >= 0.7 ? 'CRITICAL' : e.weight >= 0.4 ? 'HIGH' : 'MEDIUM',
        description: e.description || `Anomaly event ${e.event_type}`,
        metrics: {},
      })),
      gazeHeatmapData: [
        { x: 30, y: 40, count: 12 },
        { x: 75, y: 20, count: 18 },
        { x: 50, y: 50, count: 5 },
      ],
      audioSpectrumData: [
        { freqHz: 125, dB: -24 },
        { freqHz: 250, dB: -18 },
        { freqHz: 500, dB: -12 },
        { freqHz: 1000, dB: -6 },
        { freqHz: 2000, dB: -15 },
        { freqHz: 4000, dB: -28 },
      ],
      keystrokeGraphPoints: [
        { time: 1, dwellMs: 105, flightMs: 130, isAnomaly: false },
        { time: 2, dwellMs: 112, flightMs: 138, isAnomaly: false },
        { time: 3, dwellMs: 198, flightMs: 245, isAnomaly: true },
        { time: 4, dwellMs: 110, flightMs: 132, isAnomaly: false },
      ],
      debertaMatches: [],
    };
  } catch {
    return null;
  }
}

export async function submitIntervention(
  sessionId: string,
  action: 'WARN' | 'PAUSE' | 'TERMINATE',
  reason: string,
  examinerId: string = 'PR-809'
): Promise<boolean> {
  try {
    const res = await fetch(`${FUSION_URL}/api/v1/fusion/intervene`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        action,
        reason,
        examiner_id: examinerId,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function subscribeFusionSSE(onUpdate: (state: BackendAnomalyState) => void): () => void {
  try {
    const eventSource = new EventSource(`${FUSION_URL}/api/v1/fusion/stream`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.session_id) {
          onUpdate(data);
        }
      } catch {
        // ignore parse error on heartbeat
      }
    };
    return () => {
      eventSource.close();
    };
  } catch {
    return () => {};
  }
}
