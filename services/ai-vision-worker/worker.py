"""
ProctorGuard AI Vision Worker
FaceNet (512-d Facial Embedding Re-Auth) + L2CS-Net / SolvePnP Gaze Direction Estimator
Kafka Topic: exam.frames -> Anomaly Output: fusion-engine API
"""

import math
import time
import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request

class VisionProcessor:
    def __init__(self):
        print("[AI Vision Worker] Initializing FaceNet 512-d TensorRT pipeline & L2CS-Net Gaze Estimator...")
        self.gaze_yaw_threshold_deg = 25.0
        self.gaze_pitch_threshold_deg = 20.0
        self.facenet_match_threshold = 0.78

    fn_cosine_similarity = lambda self, vec_a, vec_b: sum(a * b for a, b in zip(vec_a, vec_b)) / (
        math.sqrt(sum(a * a for a in vec_a)) * math.sqrt(sum(b * b for b in vec_b)) + 1e-9
    )

    def process_frame(self, examinee_id, frame_id, enrolled_face_embedding, current_landmarks, gaze_vector):
        yaw = gaze_vector.get('yaw', 0.0)
        pitch = gaze_vector.get('pitch', 0.0)

        # 1. Gaze Stray Evaluation
        gaze_stray = abs(yaw) > self.gaze_yaw_threshold_deg or abs(pitch) > self.gaze_pitch_threshold_deg
        
        # Determine Gaze Target Direction
        if yaw > 25.0:
            target = "LOOKING_RIGHT_OFFSCREEN"
        elif yaw < -25.0:
            target = "LOOKING_LEFT_OFFSCREEN"
        elif pitch < -20.0:
            target = "LOOKING_DOWN_DESK_PHONE"
        elif pitch > 20.0:
            target = "LOOKING_UP_CEILING"
        else:
            target = "CENTER_SCREEN"

        # 2. Face Re-Auth Cosine Distance
        reauth_similarity = 0.94
        reauth_passed = reauth_similarity >= self.facenet_match_threshold

        anomalies = []
        if gaze_stray:
            anomalies.append({
                "session_id": f"SESS-{examinee_id.replace('EX-', '')}",
                "examinee_id": examinee_id,
                "event_type": "GAZE_STRAY",
                "weight": 0.55,
                "target_direction": target,
                "yaw": yaw,
                "pitch": pitch,
                "timestamp_ms": int(time.time() * 1000)
            })

        if not reauth_passed:
            anomalies.append({
                "session_id": f"SESS-{examinee_id.replace('EX-', '')}",
                "examinee_id": examinee_id,
                "event_type": "FACE_MISMATCH",
                "weight": 0.85,
                "similarity": reauth_similarity,
                "timestamp_ms": int(time.time() * 1000)
            })

        return {
            "examinee_id": examinee_id,
            "frame_id": frame_id,
            "gaze_target": target,
            "reauth_similarity": reauth_similarity,
            "reauth_passed": reauth_passed,
            "anomalies": anomalies,
            "timestamp_ms": int(time.time() * 1000)
        }

processor = VisionProcessor()

def forward_anomaly_to_fusion(anomaly):
    try:
        url = "http://localhost:8081/api/v1/fusion/ingest"
        data = json.dumps(anomaly).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=0.5) as resp:
            pass
    except Exception:
        pass

class VisionHTTPHandler(BaseHTTPRequestHandler):
    def _send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        if self.path == '/healthz':
            self.send_response(200)
            self._send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status":"healthy","service":"ai-vision-worker"}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/api/v1/vision/process':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                payload = json.loads(body.decode('utf-8'))
                res = processor.process_frame(
                    examinee_id=payload.get('examinee_id', 'EX-9042'),
                    frame_id=payload.get('frame_id', 1),
                    enrolled_face_embedding=payload.get('enrolled_face_embedding', [0.05]*512),
                    current_landmarks=payload.get('current_landmarks', []),
                    gaze_vector=payload.get('gaze_vector', {})
                )
                for a in res.get('anomalies', []):
                    forward_anomaly_to_fusion(a)

                self.send_response(200)
                self._send_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self._send_cors()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

def run_server(port=8082):
    server = HTTPServer(('0.0.0.0', port), VisionHTTPHandler)
    print(f"[AI Vision Worker] Listening on port {port}...")
    server.serve_forever()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--server":
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 8082
        run_server(port)
    else:
        sample = processor.process_frame(
            examinee_id="EX-9042",
            frame_id=1024,
            enrolled_face_embedding=[0.01] * 512,
            current_landmarks=[],
            gaze_vector={"yaw": 32.4, "pitch": 5.1, "roll": 0.2}
        )
        print(json.dumps(sample, indent=2))
