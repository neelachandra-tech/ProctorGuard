package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"sync"
	"time"
)

type SessionVerificationRequest struct {
	SessionID    string `json:"session_id"`
	ExamineeID   string `json:"examinee_id"`
	ExamineeName string `json:"examinee_name,omitempty"`
	Course       string `json:"course,omitempty"`
	ExamID       string `json:"exam_id,omitempty"`
	DeviceToken  string `json:"device_token"`
	IsVM         bool   `json:"is_vm"`
}

type SessionVerificationResponse struct {
	Status        string `json:"status"`
	LiveKitToken  string `json:"livekit_token"`
	KafkaStreamID string `json:"kafka_stream_id"`
	MaxDurationMs int64  `json:"max_duration_ms"`
	IssuedAt      int64  `json:"issued_at"`
	SessionJWT    string `json:"session_jwt"`
}

type ActiveSession struct {
	SessionID    string `json:"session_id"`
	ExamineeID   string `json:"examinee_id"`
	ExamineeName string `json:"examinee_name"`
	Course       string `json:"course"`
	ExamID       string `json:"exam_id"`
	Status       string `json:"status"` // "ACTIVE", "PAUSED", "TERMINATED"
	StartTimeMs  int64  `json:"start_time_ms"`
	DeviceToken  string `json:"device_token"`
	IsVM         bool   `json:"is_vm"`
}

type TelemetryEventRequest struct {
	SessionID     string                 `json:"session_id"`
	ExamineeID    string                 `json:"examinee_id"`
	ExamineeName  string                 `json:"examinee_name,omitempty"`
	EventType     string                 `json:"event_type"` // GAZE_STRAY, AUDIO_WHISPER, SECOND_SPEAKER, FACE_MISMATCH, KEYBOARD_ANOMALY
	Severity      string                 `json:"severity"`   // LOW, MEDIUM, HIGH, CRITICAL
	Description   string                 `json:"description"`
	Metrics       map[string]interface{} `json:"metrics,omitempty"`
	TimestampMs   int64                  `json:"timestamp_ms"`
}

type KeystrokeTelemetryRequest struct {
	SessionID      string    `json:"session_id"`
	ExamineeID     string    `json:"examinee_id"`
	AverageDwellMs float64   `json:"average_dwell_ms"`
	AverageFlightMs float64  `json:"average_flight_ms"`
	FlightSamples  []float64 `json:"flight_samples,omitempty"`
	TimestampMs    int64     `json:"timestamp_ms"`
}

type SessionRegistry struct {
	mu       sync.RWMutex
	sessions map[string]*ActiveSession
}

var registry = &SessionRegistry{
	sessions: map[string]*ActiveSession{
		"SESS-9042": {
			SessionID:    "SESS-9042",
			ExamineeID:   "EX-9042",
			ExamineeName: "Alex Rivera",
			Course:       "CS-401 Distributed Systems",
			ExamID:       "EXAM-2026-FINAL",
			Status:       "ACTIVE",
			StartTimeMs:  time.Now().UnixMilli() - 1800000,
			DeviceToken:  "DEV-TOK-SECURE-9042",
			IsVM:         false,
		},
		"SESS-4120": {
			SessionID:    "SESS-4120",
			ExamineeID:   "EX-4120",
			ExamineeName: "Elena Rostova",
			Course:       "CS-401 Distributed Systems",
			ExamID:       "EXAM-2026-FINAL",
			Status:       "ACTIVE",
			StartTimeMs:  time.Now().UnixMilli() - 2400000,
			DeviceToken:  "DEV-TOK-SECURE-4120",
			IsVM:         false,
		},
	},
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
}

func verifySessionHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	var req SessionVerificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid_json"}`, http.StatusBadRequest)
		return
	}

	if req.IsVM {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error":   "ACCESS_DENIED_VM_DETECTED",
			"message": "Examination policy strictly prohibits virtual machine hypervisors.",
		})
		return
	}

	name := req.ExamineeName
	if name == "" {
		name = fmt.Sprintf("Examinee %s", req.ExamineeID)
	}
	course := req.Course
	if course == "" {
		course = "CS-401 Distributed Systems"
	}
	examID := req.ExamID
	if examID == "" {
		examID = "EXAM-2026-FINAL"
	}

	// Register or update active session
	registry.mu.Lock()
	registry.sessions[req.SessionID] = &ActiveSession{
		SessionID:    req.SessionID,
		ExamineeID:   req.ExamineeID,
		ExamineeName: name,
		Course:       course,
		ExamID:       examID,
		Status:       "ACTIVE",
		StartTimeMs:  time.Now().UnixMilli(),
		DeviceToken:  req.DeviceToken,
		IsVM:         false,
	}
	registry.mu.Unlock()

	// Generate tamper-evident session token
	rawPayload := fmt.Sprintf("%s:%s:%d", req.SessionID, req.ExamineeID, time.Now().Unix())
	hash := sha256.Sum256([]byte(rawPayload))
	sessionJWT := hex.EncodeToString(hash[:])

	resp := SessionVerificationResponse{
		Status:        "VERIFIED_SESSION_ACTIVE",
		LiveKitToken:  fmt.Sprintf("livekit_token_%s_%d", req.ExamineeID, time.Now().Unix()),
		KafkaStreamID: fmt.Sprintf("stream_%s", req.SessionID),
		MaxDurationMs: 10800000, // 3 hours
		IssuedAt:      time.Now().UnixMilli(),
		SessionJWT:    sessionJWT,
	}

	json.NewEncoder(w).Encode(resp)
}

func listSessionsHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	registry.mu.RLock()
	sessionsList := make([]*ActiveSession, 0, len(registry.sessions))
	for _, sess := range registry.sessions {
		sessionsList = append(sessionsList, sess)
	}
	registry.mu.RUnlock()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"sessions": sessionsList,
		"total":    len(sessionsList),
	})
}

func telemetryEventHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	var evt TelemetryEventRequest
	if err := json.NewDecoder(r.Body).Decode(&evt); err != nil {
		http.Error(w, `{"error":"invalid_event_payload"}`, http.StatusBadRequest)
		return
	}

	if evt.TimestampMs == 0 {
		evt.TimestampMs = time.Now().UnixMilli()
	}

	// Weight assignment based on severity
	weight := 0.35
	switch evt.Severity {
	case "CRITICAL":
		weight = 0.90
	case "HIGH":
		weight = 0.65
	case "MEDIUM":
		weight = 0.45
	case "LOW":
		weight = 0.20
	}

	// Forward to Fusion Engine on localhost:8081
	fusionPayload := map[string]interface{}{
		"session_id":   evt.SessionID,
		"examinee_id":  evt.ExamineeID,
		"event_type":   evt.EventType,
		"weight":       weight,
		"timestamp_ms": evt.TimestampMs,
	}
	fBytes, _ := json.Marshal(fusionPayload)

	client := &http.Client{Timeout: 800 * time.Millisecond}
	go func() {
		resp, err := client.Post("http://localhost:8081/api/v1/fusion/ingest", "application/json", bytes.NewBuffer(fBytes))
		if err == nil && resp != nil {
			resp.Body.Close()
		}
	}()

	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "EVENT_INGESTED",
		"session_id":  evt.SessionID,
		"event_type":  evt.EventType,
		"assigned_w":  weight,
		"recorded_at": evt.TimestampMs,
	})
}

func telemetryKeystrokeHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	var req KeystrokeTelemetryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid_keystroke_payload"}`, http.StatusBadRequest)
		return
	}

	baselineDwell := 110.0
	dwellDeviation := math.Abs(req.AverageDwellMs-baselineDwell) / baselineDwell
	isAnomalous := dwellDeviation > 0.45

	if isAnomalous {
		fusionPayload := map[string]interface{}{
			"session_id":   req.SessionID,
			"examinee_id":  req.ExamineeID,
			"event_type":   "KEYBOARD_ANOMALY",
			"weight":       0.60,
			"timestamp_ms": time.Now().UnixMilli(),
		}
		fBytes, _ := json.Marshal(fusionPayload)
		client := &http.Client{Timeout: 800 * time.Millisecond}
		go func() {
			resp, err := client.Post("http://localhost:8081/api/v1/fusion/ingest", "application/json", bytes.NewBuffer(fBytes))
			if err == nil && resp != nil {
				resp.Body.Close()
			}
		}()
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          "KEYSTROKE_EVALUATED",
		"is_anomalous":    isAnomalous,
		"dwell_deviation": round(dwellDeviation, 3),
	})
}

func round(val float64, precision int) float64 {
	pow := math.Pow(10, float64(precision))
	return math.Round(val*pow) / pow
}

func main() {
	http.HandleFunc("/api/v1/session/verify", verifySessionHandler)
	http.HandleFunc("/api/v1/sessions", listSessionsHandler)
	http.HandleFunc("/api/v1/telemetry/event", telemetryEventHandler)
	http.HandleFunc("/api/v1/telemetry/keystroke", telemetryKeystrokeHandler)
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"api-gateway"}`))
	})

	log.Println("[API Gateway] Listening on :8080 (REST, Telemetry & Session Management)...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Gateway server failed: %v", err)
	}
}
