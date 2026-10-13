/**
 * ProctorGuard Desktop Client API Client
 * Connects to API Gateway (:8080) and Fusion Engine (:8081)
 */

const GATEWAY_URL = 'http://localhost:8080';
const FUSION_URL = 'http://localhost:8081';

export interface VerifySessionParams {
  sessionId: string;
  examineeId: string;
  examineeName?: string;
  course?: string;
  examId?: string;
  deviceToken: string;
  isVm: boolean;
}

export interface VerifySessionResult {
  status: string;
  livekitToken?: string;
  kafkaStreamId?: string;
  maxDurationMs?: number;
  sessionJwt?: string;
  error?: string;
}

export async function verifySessionWithGateway(params: VerifySessionParams): Promise<VerifySessionResult> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/v1/session/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: params.sessionId,
        examinee_id: params.examineeId,
        examinee_name: params.examineeName,
        course: params.course,
        exam_id: params.examId,
        device_token: params.deviceToken,
        is_vm: params.isVm,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { status: 'DENIED', error: errData.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return {
      status: data.status,
      livekitToken: data.livekit_token,
      kafkaStreamId: data.kafka_stream_id,
      maxDurationMs: data.max_duration_ms,
      sessionJwt: data.session_jwt,
    };
  } catch {
    // Graceful offline fallback
    return {
      status: 'VERIFIED_SESSION_ACTIVE (OFFLINE_MODE)',
      livekitToken: `fallback_token_${params.examineeId}`,
      kafkaStreamId: `stream_${params.sessionId}`,
      maxDurationMs: 10800000,
      sessionJwt: 'offline_dev_jwt_hash',
    };
  }
}

export interface TelemetryEventPayload {
  sessionId: string;
  examineeId: string;
  examineeName?: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  metrics?: Record<string, unknown>;
  timestampMs?: number;
}

export async function postTelemetryEvent(payload: TelemetryEventPayload): Promise<boolean> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/v1/telemetry/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: payload.sessionId,
        examinee_id: payload.examineeId,
        examinee_name: payload.examineeName,
        event_type: payload.eventType,
        severity: payload.severity,
        description: payload.description,
        metrics: payload.metrics,
        timestamp_ms: payload.timestampMs || Date.now(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface KeystrokePayload {
  sessionId: string;
  examineeId: string;
  averageDwellMs: number;
  averageFlightMs: number;
}

export async function postKeystrokeTelemetry(payload: KeystrokePayload): Promise<boolean> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/v1/telemetry/keystroke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: payload.sessionId,
        examinee_id: payload.examineeId,
        average_dwell_ms: payload.averageDwellMs,
        average_flight_ms: payload.averageFlightMs,
        timestamp_ms: Date.now(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
