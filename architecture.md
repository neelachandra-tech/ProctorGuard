# System Architecture

The following diagram illustrates the end-to-end data pipeline from the edge kiosk client through stream ingestion, neural inference workers, continuous risk scoring, and evidence storage.

```mermaid
flowchart LR

    subgraph "1. Edge & Client Tier (Tauri / Rust)"
        Kiosk["Tauri / Rust Kiosk Client"]
        Hooks["Win32 Low-Level Hooks (Input & Focus Lock)"]
        CPUID["Hardware Attestation (CPUID)"]
        
        Kiosk --> Hooks
        Kiosk --> CPUID
    end

    subgraph "2. Ingestion & Streaming Bus"
        LiveKit["LiveKit SFU (WebRTC Media)"]
        Kafka["Apache Kafka (Events)"]
    end

    subgraph "3. ONNX Inference Workers"
        FaceNet["FaceNet (Vision/ID)"]
        SolvePnP["SolvePnP (Gaze/Pose)"]
        VAD["Silero VAD (Voice Activity)"]
        DeBERTa["DeBERTa (NLP/Anomalies)"]
    end

    subgraph "4. Scoring Engine"
        RiskEngine["Exponential Decay Risk Engine<br/>R(t) = R₀ · e^(-λΔt) + S"]
    end

    subgraph "5. Evidence Vault"
        TimescaleDB[("TimescaleDB (Time-Series Metric Logs)")]
        MinIO[("MinIO Object Storage (Encrypted Media)")]
    end

    Kiosk -->|"A/V Tracks"| LiveKit
    Kiosk -->|"Telemetry & Events"| Kafka

    LiveKit --> FaceNet
    LiveKit --> SolvePnP
    LiveKit --> VAD
    Kafka --> DeBERTa

    FaceNet -->|"Scoring & Features"| RiskEngine
    SolvePnP -->|"Scoring & Features"| RiskEngine
    VAD -->|"Scoring & Features"| RiskEngine
    DeBERTa --> RiskEngine

    RiskEngine -->|"State Logs"| TimescaleDB
    RiskEngine -->|"Flagged Media"| MinIO
```
