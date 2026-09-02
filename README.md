# ProctorGuard: Multi-Agent Biometric Proctoring & AI Anomaly Fusion Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-v2.0-blueviolet.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Go](https://img.shields.io/badge/Go-1.22-00ADD8.svg)](https://go.dev/)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-1.19-yellow.svg)](https://onnxruntime.ai/)

**ProctorGuard** is an enterprise-grade, multi-agent remote proctoring architecture designed to detect cheating across visual, audio, keystroke biometric, and NLP text channels in real time.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client Tier
        DC["Desktop Kiosk App (React 19 + Tauri v2 Rust Hooks)"]
        EP["Examiner Web Portal (Standalone React 19 + Tailwind)"]
    end

    subgraph Core Services Tier (Go)
        GW["API Gateway (Port 8080)"]
        FE["Anomaly Fusion Engine (Port 8081)"]
    end

    subgraph AI Microservice Workers (Python + ONNX)
        VW["FaceNet Vision Worker (Headcount & Gaze Vector)"]
        AW["Silero VAD Audio Worker (Voice Activity & Pitch)"]
        NW["DeBERTa NLP Collusion Worker (Answer Similarity)"]
    end

    subgraph Message Broker & Persistence
        KAFKA[("Apache Kafka (Port 9092)")]
        REDIS[("Redis State Store (Port 6379)")]
    end

    DC -->|POST /api/v1/session/verify| GW
    DC -->|Keystroke & Stream Telemetry| GW
    GW -->|Publish Events| KAFKA
    VW & AW & NW -->|Produce Telemetry Streams| KAFKA
    FE -->|Consume Kafka Streams & Compute Exponential Decay Risk| REDIS
    EP -->|Fetch Real-Time Risk & Evidence Bundles| FE
```

---

## 🚀 Key Features & Capabilities

1. **Desktop OS Lockdown (Tauri v2 + Rust)**:
   - Low-level keyboard hook (`WH_KEYBOARD_LL`) blocking unauthorized key combinations (`Alt+Tab`, `Win`, `PrintScreen`).
   - Hardware CPUID hypervisor bit detection blocking Virtual Machines (`VMware`, `VirtualBox`, `KVM`).
   - Process watchdog auto-terminating blacklisted applications (`OBS`, `Discord`, `TeamViewer`).

2. **Multi-Modal AI Anomaly Workers**:
   - **FaceNet Vision**: Tracks gaze pitch/yaw vectors and headcount (missing or multiple faces).
   - **Silero VAD Audio**: Detects background whisper energy and secondary speaker pitch shifts.
   - **DeBERTa-v3 NLP**: Performs transformer embedding similarity analysis to detect copy-pasting and collusion across examinees.

3. **Temporal Decay Risk Score Fusion (Go)**:
   - Evaluates multi-channel risk using exponential decay $R(t) = \sum w_i e^{-\lambda \Delta t}$.
   - Categorizes examinee threat states: `CLEAR` (<35%), `SUSPICIOUS` (35%-70%), `CRITICAL` (>70%).

4. **Forensic Examiner Portal**:
   - Live concurrent session grid monitoring 1,000+ candidates.
   - DeBERTa pairwise collusion cluster graph visualizer.
   - Cryptographic SHA-256 evidence bundle inspector with gaze heatmaps, audio spectrums, and keystroke flight graphs.

---

## 💻 Quick Start & Commands

```bash
# 1. Initialize ONNX model directory stubs
npm run setup:models

# 2. Build all frontend and microservice packages
npm run build

# 3. Launch Desktop Lockdown Client
npm run dev:desktop

# 4. Launch Standalone Examiner Web Portal
npm run dev:examiner

# 5. Run Backend Unit Tests
go test ./... --workspaces
```

---

## 📂 Project Structure

```
ProctorGuard/
├── apps/
│   ├── desktop-client/      # React 19 + Tauri v2 Kiosk Application
│   └── examiner-portal/     # Standalone React 19 Examiner Web Portal
├── services/
│   ├── api-gateway/         # Go HTTP Session Verification Service
│   ├── fusion-engine/       # Go Real-time Anomaly Aggregation Engine
│   ├── ai-vision-worker/    # Python FaceNet Gaze & Headcount Worker
│   ├── ai-audio-worker/     # Python Silero VAD Speech Worker
│   └── ai-nlp-collusion/    # Python DeBERTa Text Collusion Worker
├── infra/
│   ├── docker-compose.dev.yml
│   └── k8s/                 # Kubernetes Manifests
├── scripts/
│   └── download_models.py   # ONNX Model Weight Manager
├── package.json
└── README.md
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
