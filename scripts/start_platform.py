#!/usr/bin/env python3
"""
ProctorGuard Unified Multi-Agent Platform Orchestrator
Launches and monitors all 7 architectural tiers:
- Tier 1: Go API Gateway (:8080)
- Tier 2: Go Temporal Fusion Engine (:8081)
- Tier 3: AI FaceNet Vision Worker (:8082)
- Tier 4: AI Silero VAD Audio Worker (:8083)
- Tier 5: AI DeBERTa NLP Collusion Worker (:8084)
- Tier 6: Desktop Client Kiosk App (:5173)
- Tier 7: Standalone Examiner Portal (:5174)
"""

import subprocess
import time
import sys
import os
import urllib.request
import signal

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SERVICES = [
    {
        "name": "API Gateway (Go)",
        "cmd": ["go", "run", "main.go"],
        "cwd": os.path.join(BASE_DIR, "services", "api-gateway"),
        "url": "http://localhost:8080/healthz",
        "port": 8080
    },
    {
        "name": "Fusion Engine (Go)",
        "cmd": ["go", "run", "main.go"],
        "cwd": os.path.join(BASE_DIR, "services", "fusion-engine"),
        "url": "http://localhost:8081/healthz",
        "port": 8081
    },
    {
        "name": "AI Vision Worker",
        "cmd": [sys.executable, "worker.py", "--server", "8082"],
        "cwd": os.path.join(BASE_DIR, "services", "ai-vision-worker"),
        "url": "http://localhost:8082/healthz",
        "port": 8082
    },
    {
        "name": "AI Audio Worker",
        "cmd": [sys.executable, "worker.py", "--server", "8083"],
        "cwd": os.path.join(BASE_DIR, "services", "ai-audio-worker"),
        "url": "http://localhost:8083/healthz",
        "port": 8083
    },
    {
        "name": "AI NLP Collusion Worker",
        "cmd": [sys.executable, "worker.py", "--server", "8084"],
        "cwd": os.path.join(BASE_DIR, "services", "ai-nlp-collusion"),
        "url": "http://localhost:8084/healthz",
        "port": 8084
    },
    {
        "name": "Desktop Client Kiosk",
        "cmd": ["npm", "run", "dev:desktop"],
        "cwd": BASE_DIR,
        "url": "http://localhost:5173",
        "port": 5173
    },
    {
        "name": "Examiner Web Portal",
        "cmd": ["npm", "run", "dev:examiner"],
        "cwd": BASE_DIR,
        "url": "http://localhost:5174",
        "port": 5174
    }
]

processes = []

def check_service(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'ProctorGuard-HealthCheck'})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status in (200, 304)
    except Exception:
        return False

def shutdown_all(signum=None, frame=None):
    print("\n[!] Shutting down all ProctorGuard microservices...")
    for p, svc in processes:
        try:
            p.terminate()
        except Exception:
            pass
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, shutdown_all)
    signal.signal(signal.SIGTERM, shutdown_all)

    print("==================================================================")
    print("   ProctorGuard: Unified Multi-Agent Proctoring Orchestrator      ")
    print("==================================================================")

    for svc in SERVICES:
        print(f"[*] Starting {svc['name']} (Port {svc['port']})...")
        shell_needed = sys.platform == "win32" and svc["cmd"][0] in ("npm", "go")
        p = subprocess.Popen(
            svc["cmd"],
            cwd=svc["cwd"],
            shell=shell_needed,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        processes.append((p, svc))

    print("\n[*] Waiting for microservice warmup and health checks...\n")
    time.sleep(3)

    for attempt in range(1, 6):
        all_ready = True
        print(f"--- Health Check Round {attempt}/5 ---")
        for p, svc in processes:
            status = check_service(svc["url"])
            mark = "READY [200 OK]" if status else "WAITING..."
            if not status:
                all_ready = False
            print(f"  • {svc['name']:<28} -> {mark} ({svc['url']})")
        if all_ready:
            print("\n[+] All ProctorGuard microservices are healthy and actively streaming!")
            break
        time.sleep(2)

    print("\n==================================================================")
    print("  Active Endpoints:")
    print("  - Desktop Client Kiosk: http://localhost:5173")
    print("  - Examiner Web Portal:  http://localhost:5174")
    print("  - API Gateway:          http://localhost:8080")
    print("  - Fusion Anomaly Engine:http://localhost:8081")
    print("==================================================================")
    print("Press Ctrl+C to terminate all services.\n")

    try:
        while True:
            time.sleep(5)
    except KeyboardInterrupt:
        shutdown_all()

if __name__ == "__main__":
    main()
