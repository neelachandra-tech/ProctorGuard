package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"sync"
	"time"
)

type AnomalyEvent struct {
	SessionID   string  `json:"session_id"`
	ExamineeID  string  `json:"examinee_id"`
	EventType   string  `json:"event_type"` // "GAZE_STRAY", "AUDIO_WHISPER", "SECOND_SPEAKER", "FACE_MISMATCH", "KEYBOARD_ANOMALY"
	Weight      float64 `json:"weight"`
	TimestampMs int64   `json:"timestamp_ms"`
}

type AnomalyState struct {
	SessionID    string         `json:"session_id"`
	ExamineeID   string         `json:"examinee_id"`
	Events       []AnomalyEvent `json:"events"`
	RiskScore    float64        `json:"risk_score"`
	ThreatStatus string         `json:"threat_status"` // "CLEAR", "SUSPICIOUS", "CRITICAL"
	LastUpdateMs int64          `json:"last_update_ms"`
}

type FusionEngine struct {
	mu           sync.RWMutex
	decayLambda  float64 // Temporal decay factor: 0.0001 per ms (half-life ~6.9s)
	activeStates map[string]*AnomalyState
}

func NewFusionEngine() *FusionEngine {
	return &FusionEngine{
		decayLambda:  0.00005,
		activeStates: make(map[string]*AnomalyState),
	}
}

func (fe *FusionEngine) IngestEvent(event AnomalyEvent) *AnomalyState {
	fe.mu.Lock()
	defer fe.mu.Unlock()

	state, exists := fe.activeStates[event.SessionID]
	if !exists {
		state = &AnomalyState{
			SessionID:  event.SessionID,
			ExamineeID: event.ExamineeID,
			Events:     make([]AnomalyEvent, 0),
		}
		fe.activeStates[event.SessionID] = state
	}

	state.Events = append(state.Events, event)
	now := time.Now().UnixMilli()

	// Compute decay weighted risk score R(t) = sum(w_i * e^(-lambda * dt))
	var cumulativeRisk float64 = 0.0
	for _, ev := range state.Events {
		dt := float64(now - ev.TimestampMs)
		if dt < 0 {
			dt = 0
		}
		decay := math.Exp(-fe.decayLambda * dt)
		cumulativeRisk += ev.Weight * decay
	}

	// Normalize risk score to 0.0 - 1.0
	state.RiskScore = math.Min(1.0, cumulativeRisk/3.0)
	state.LastUpdateMs = now

	if state.RiskScore >= 0.70 {
		state.ThreatStatus = "CRITICAL"
	} else if state.RiskScore >= 0.35 {
		state.ThreatStatus = "SUSPICIOUS"
	} else {
		state.ThreatStatus = "CLEAR"
	}

	return state
}

func main() {
	engine := NewFusionEngine()

	http.HandleFunc("/api/v1/fusion/ingest", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		var ev AnomalyEvent
		if err := json.NewDecoder(r.Body).Decode(&ev); err != nil {
			http.Error(w, `{"error":"invalid_payload"}`, http.StatusBadRequest)
			return
		}

		if ev.TimestampMs == 0 {
			ev.TimestampMs = time.Now().UnixMilli()
		}

		updatedState := engine.IngestEvent(ev)
		json.NewEncoder(w).Encode(updatedState)
	})

	http.HandleFunc("/api/v1/fusion/state", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		sessionID := r.URL.Query().Get("session_id")
		engine.mu.RLock()
		state, exists := engine.activeStates[sessionID]
		engine.mu.RUnlock()

		if !exists {
			http.Error(w, `{"error":"session_not_found"}`, http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(state)
	})

	fmt.Println("[Fusion Engine] Temporal decay anomaly engine listening on :8081...")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
