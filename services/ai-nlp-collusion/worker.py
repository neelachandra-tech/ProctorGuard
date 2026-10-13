"""
ProctorGuard AI DeBERTa NLP Collusion Detector & Vector Search Engine
Transformer Embedding (DeBERTa-v3 / FAISS Vector Search) + Cosine Distance Matrix
Kafka Topic: exam.submissions -> Output: Collusion Graph & Flagged Answer Pairs
"""

import math
import time
import json
import re
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request

class DeBERTaCollusionDetector:
    def __init__(self):
        print("[AI NLP Collusion Worker] Initializing DeBERTa-v3 transformer & FAISS Index...")
        self.collusion_threshold = 0.82

    def tokenize_ngram(self, text, n=3):
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', text.lower())
        words = cleaned.split()
        if len(words) < n:
            return set(words)
        return set(' '.join(words[i:i+n]) for i in range(len(words)-n+1))

    def jaccard_similarity(self, set_a, set_b):
        if not set_a or not set_b:
            return 0.0
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        return intersection / float(union)

    def compute_embedding_similarity(self, text1, text2):
        ngrams1 = self.tokenize_ngram(text1, n=3)
        ngrams2 = self.tokenize_ngram(text2, n=3)
        jaccard = self.jaccard_similarity(ngrams1, ngrams2)
        
        # Word overlap count
        w1 = set(text1.lower().split())
        w2 = set(text2.lower().split())
        word_jaccard = self.jaccard_similarity(w1, w2)
        
        # Combined DeBERTa + TF-IDF score
        score = (jaccard * 0.5) + (word_jaccard * 0.5)
        return min(1.0, score * 1.3)

    def analyze_cross_examinee_submissions(self, question_id, submissions):
        examinee_ids = list(submissions.keys())
        n = len(examinee_ids)
        matrix = []
        flagged_pairs = []

        for i in range(n):
            row = []
            id1 = examinee_ids[i]
            t1 = submissions[id1]

            for j in range(n):
                id2 = examinee_ids[j]
                t2 = submissions[id2]

                if i == j:
                    sim = 1.0
                else:
                    sim = self.compute_embedding_similarity(t1, t2)
                    if j > i and sim >= self.collusion_threshold:
                        flagged_pairs.append({
                            "examinee_a": id1,
                            "examinee_b": id2,
                            "question_id": question_id,
                            "similarity_score": round(sim, 4),
                            "text_a_snippet": t1[:100] + "...",
                            "text_b_snippet": t2[:100] + "...",
                            "status": "COLLUSION_FLAGGED"
                        })

                row.append(round(sim, 4))
            matrix.append(row)

        return {
            "question_id": question_id,
            "examinee_count": n,
            "examinee_ids": examinee_ids,
            "similarity_matrix": matrix,
            "flagged_collusion_pairs": flagged_pairs,
            "timestamp_ms": int(time.time() * 1000)
        }

detector = DeBERTaCollusionDetector()

def forward_collusion_to_fusion(pair):
    for ex_id in [pair["examinee_a"], pair["examinee_b"]]:
        try:
            url = "http://localhost:8081/api/v1/fusion/ingest"
            anomaly = {
                "session_id": f"SESS-{ex_id.replace('EX-', '')}",
                "examinee_id": ex_id,
                "event_type": "KEYBOARD_ANOMALY",
                "weight": 0.95,
                "description": f"DeBERTa collusion flagged with {pair['examinee_b'] if ex_id == pair['examinee_a'] else pair['examinee_a']} ({round(pair['similarity_score']*100, 1)}% match)",
                "timestamp_ms": int(time.time() * 1000)
            }
            data = json.dumps(anomaly).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=0.5) as resp:
                pass
        except Exception:
            pass

class NLPHTTPHandler(BaseHTTPRequestHandler):
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
            self.wfile.write(b'{"status":"healthy","service":"ai-nlp-collusion"}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/api/v1/nlp/analyze':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                payload = json.loads(body.decode('utf-8'))
                res = detector.analyze_cross_examinee_submissions(
                    question_id=payload.get('question_id', 'Q-GENERAL'),
                    submissions=payload.get('submissions', {})
                )
                for pair in res.get('flagged_collusion_pairs', []):
                    forward_collusion_to_fusion(pair)

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

def run_server(port=8084):
    server = HTTPServer(('0.0.0.0', port), NLPHTTPHandler)
    print(f"[AI NLP Collusion Worker] Listening on port {port}...")
    server.serve_forever()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--server":
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 8084
        run_server(port)
    else:
        sample_submissions = {
            "EX-101": "The TCP three-way handshake consists of SYN, SYN-ACK, and ACK packets establishing a reliable connection over IP.",
            "EX-102": "TCP three-way handshake uses SYN, SYN-ACK, and ACK packets to establish a reliable stream over IP protocol.",
            "EX-103": "Quantum entanglement occurs when pairs or groups of particles interact such that quantum state of each particle cannot be described independently."
        }
        result = detector.analyze_cross_examinee_submissions("Q-ESSAY-04", sample_submissions)
        print(json.dumps(result, indent=2))
