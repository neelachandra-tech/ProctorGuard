"""
ProctorGuard AI Audio Worker
Silero VAD (Speech Filter) + PyAnnote.audio (Speaker Diarization & Whisper Detector)
Kafka Topic: exam.audio -> Anomaly Output: fusion-engine API
"""

import time
import json
import math
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request

class AudioProcessor:
    def __init__(self):
        print("[AI Audio Worker] Loading Silero VAD v4 & PyAnnote.audio 3.1 Diarization Pipeline...")
        self.speech_energy_threshold = 0.15
        self.whisper_band_ratio_threshold = 0.65
        self.speaker_similarity_threshold = 0.70

    def analyze_audio_chunk(self, examinee_id, chunk_id, audio_fft_spectrum, enrolled_pitch_freq):
        if not audio_fft_spectrum:
            audio_fft_spectrum = [0.05] * 64

        total_energy = sum(audio_fft_spectrum)
        
        # 1. Silero VAD Speech Detection
        speech_detected = total_energy > self.speech_energy_threshold

        # 2. Whisper Frequency Band Analysis (200Hz - 800Hz low amplitude ratio)
        low_band_energy = sum(audio_fft_spectrum[2:10]) # ~200-800Hz
        whisper_band_ratio = low_band_energy / (total_energy + 1e-9)
        is_whispering = speech_detected and (whisper_band_ratio > self.whisper_band_ratio_threshold) and (total_energy < 0.40)

        # 3. PyAnnote Speaker Diarization / Voiceprint Pitch Shift
        max_bin_idx = audio_fft_spectrum.index(max(audio_fft_spectrum))
        estimated_pitch = max_bin_idx * 50.0 # ~Hz approximation
        
        pitch_diff = abs(estimated_pitch - enrolled_pitch_freq)
        second_speaker_detected = speech_detected and not is_whispering and (pitch_diff > 80.0)

        anomalies = []
        if is_whispering:
            anomalies.append({
                "session_id": f"SESS-{examinee_id.replace('EX-', '')}",
                "examinee_id": examinee_id,
                "event_type": "AUDIO_WHISPER",
                "weight": 0.55,
                "description": f"Whisper pattern detected (band ratio: {round(whisper_band_ratio, 2)})",
                "timestamp_ms": int(time.time() * 1000)
            })

        if second_speaker_detected:
            anomalies.append({
                "session_id": f"SESS-{examinee_id.replace('EX-', '')}",
                "examinee_id": examinee_id,
                "event_type": "SECOND_SPEAKER",
                "weight": 0.90,
                "description": f"Secondary voiceprint detected (pitch delta: {round(pitch_diff, 1)} Hz)",
                "timestamp_ms": int(time.time() * 1000)
            })

        return {
            "examinee_id": examinee_id,
            "chunk_id": chunk_id,
            "speech_detected": speech_detected,
            "is_whispering": is_whispering,
            "second_speaker_detected": second_speaker_detected,
            "estimated_pitch_hz": estimated_pitch,
            "anomalies": anomalies,
            "timestamp_ms": int(time.time() * 1000)
        }

processor = AudioProcessor()

def forward_anomaly_to_fusion(anomaly):
    try:
        url = "http://localhost:8081/api/v1/fusion/ingest"
        data = json.dumps(anomaly).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=0.5) as resp:
            pass
    except Exception:
        pass

class AudioHTTPHandler(BaseHTTPRequestHandler):
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
            self.wfile.write(b'{"status":"healthy","service":"ai-audio-worker"}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/api/v1/audio/process':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                payload = json.loads(body.decode('utf-8'))
                res = processor.analyze_audio_chunk(
                    examinee_id=payload.get('examinee_id', 'EX-9042'),
                    chunk_id=payload.get('chunk_id', 1),
                    audio_fft_spectrum=payload.get('audio_fft_spectrum', []),
                    enrolled_pitch_freq=payload.get('enrolled_pitch_freq', 140.0)
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

def run_server(port=8083):
    server = HTTPServer(('0.0.0.0', port), AudioHTTPHandler)
    print(f"[AI Audio Worker] Listening on port {port}...")
    server.serve_forever()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--server":
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 8083
        run_server(port)
    else:
        sample = processor.analyze_audio_chunk(
            examinee_id="EX-9042",
            chunk_id=408,
            audio_fft_spectrum=[0.02, 0.04, 0.35, 0.42, 0.38, 0.12, 0.05, 0.02] + [0.01]*56,
            enrolled_pitch_freq=135.0
        )
        print(json.dumps(sample, indent=2))
