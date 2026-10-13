package main

import (
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

type AnomalyEvent struct {
	SessionID   string  `json:"session_id"`
	ExamineeID  string  `json:"examinee_id"`
	EventType   string  `json:"event_type"` // GAZE_STRAY, AUDIO_WHISPER, SECOND_SPEAKER, FACE_MISMATCH, KEYBOARD_ANOMALY
	Weight      float64 `json:"weight"`
	Description string  `json:"description,omitempty"`
	TimestampMs int64   `json:"timestamp_ms"`
}

type Intervention struct {
	Action      string `json:"action"` // "WARN", "PAUSE", "TERMINATE"
	Reason      string `json:"reason"`
	ExaminerID  string `json:"examiner_id"`
	TimestampMs int64  `json:"timestamp_ms"`
}

type AnomalyState struct {
	SessionID     string         `json:"session_id"`
	ExamineeID    string         `json:"examinee_id"`
	ExamineeName  string         `json:"examinee_name"`
	Course        string         `json:"course"`
	Events        []AnomalyEvent `json:"events"`
	RiskScore     float64        `json:"risk_score"`
	ThreatStatus  string         `json:"threat_status"` // "CLEAR", "SUSPICIOUS", "CRITICAL"
	LastUpdateMs  int64          `json:"last_update_ms"`
	Interventions []Intervention `json:"interventions"`
}

type EvidenceBundle struct {
	BundleID            string         `json:"bundle_id"`
	SessionID           string         `json:"session_id"`
	ExamineeID          string         `json:"examinee_id"`
	ExamineeName        string         `json:"examinee_name"`
	IntegrityHashSHA256 string         `json:"integrity_hash_sha256"`
	RiskScore           float64        `json:"risk_score"`
	ThreatStatus        string         `json:"threat_status"`
	GeneratedAtMs       int64          `json:"generated_at_ms"`
	TotalEvents         int            `json:"total_events"`
	Events              []AnomalyEvent `json:"events"`
	Interventions       []Intervention `json:"interventions"`
}

type FusionEngine struct {
	mu           sync.RWMutex
	decayLambda  float64 // Temporal decay factor: 0.00005 per ms (half-life ~13.8s)
	activeStates map[string]*AnomalyState
	subscribers  map[chan *AnomalyState]bool
}

func NewFusionEngine() *FusionEngine {
	fe := &FusionEngine{
		decayLambda:  0.00005,
		activeStates: make(map[string]*AnomalyState),
		subscribers:  make(map[chan *AnomalyState]bool),
	}

	// Seed with active sessions for realistic initial dashboard presentation
	now := time.Now().UnixMilli()
	fe.activeStates["SESS-9042"] = &AnomalyState{
		SessionID:     "SESS-9042",
		ExamineeID:    "EX-9042",
		ExamineeName:  "Alex Rivera",
		Course:        "CS-401 Distributed Systems",
		Events:        []AnomalyEvent{},
		RiskScore:     0.12,
		ThreatStatus:  "CLEAR",
		LastUpdateMs:  now - 120000,
		Interventions: []Intervention{},
	}

	fe.activeStates["SESS-4120"] = &AnomalyState{
		SessionID:    "SESS-4120",
		ExamineeID:   "EX-4120",
		ExamineeName: "Elena Rostova",
		Course:       "CS-401 Distributed Systems",
		Events: []AnomalyEvent{
			{
				SessionID:   "SESS-4120",
				ExamineeID:  "EX-4120",
				EventType:   "GAZE_STRAY",
				Weight:      0.65,
				Description: "Gaze deviated off-screen towards secondary display (>10s)",
				TimestampMs: now - 35000,
			},
			{
				SessionID:   "SESS-4120",
				ExamineeID:  "EX-4120",
				EventType:   "AUDIO_WHISPER",
				Weight:      0.55,
				Description: "Low-frequency whisper spectrum detected",
				TimestampMs: now - 15000,
			},
		},
		RiskScore:     0.78,
		ThreatStatus:  "CRITICAL",
		LastUpdateMs:  now - 15000,
		Interventions: []Intervention{},
	}

	return fe
}

func (fe *FusionEngine) IngestEvent(event AnomalyEvent) *AnomalyState {
	fe.mu.Lock()
	defer fe.mu.Unlock()

	state, exists := fe.activeStates[event.SessionID]
	if !exists {
		name := fmt.Sprintf("Examinee %s", event.ExamineeID)
		if event.ExamineeID == "EX-9042" {
			name = "Alex Rivera"
		}
		state = &AnomalyState{
			SessionID:     event.SessionID,
			ExamineeID:    event.ExamineeID,
			ExamineeName:  name,
			Course:        "CS-401 Distributed Systems",
			Events:        make([]AnomalyEvent, 0),
			Interventions: make([]Intervention, 0),
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

	// Normalize risk score to 0.0 - 1.0 (clamped)
	state.RiskScore = math.Min(1.0, math.Round((cumulativeRisk/2.2)*100)/100)
	state.LastUpdateMs = now

	if state.RiskScore >= 0.70 {
		state.ThreatStatus = "CRITICAL"
	} else if state.RiskScore >= 0.35 {
		state.ThreatStatus = "SUSPICIOUS"
	} else {
		state.ThreatStatus = "CLEAR"
	}

	// Broadcast to SSE listeners asynchronously
	for ch := range fe.subscribers {
		select {
		case ch <- state:
		default:
		}
	}

	return state
}

func (fe *FusionEngine) GenerateEvidenceBundle(sessionID string) (*EvidenceBundle, error) {
	fe.mu.RLock()
	state, exists := fe.activeStates[sessionID]
	fe.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("session not found")
	}

	now := time.Now().UnixMilli()
	rawString := fmt.Sprintf("%s:%s:%.4f:%d:%d", state.SessionID, state.ExamineeID, state.RiskScore, len(state.Events), now)
	hasher := sha256.New()
	hasher.Write([]byte(rawString))
	hashHex := hex.EncodeToString(hasher.Sum(nil))

	bundle := &EvidenceBundle{
		BundleID:            fmt.Sprintf("EVD-%s-%d", state.SessionID, now%100000),
		SessionID:           state.SessionID,
		ExamineeID:          state.ExamineeID,
		ExamineeName:        state.ExamineeName,
		IntegrityHashSHA256: hashHex,
		RiskScore:           state.RiskScore,
		ThreatStatus:        state.ThreatStatus,
		GeneratedAtMs:       now,
		TotalEvents:         len(state.Events),
		Events:              state.Events,
		Interventions:       state.Interventions,
	}

	return bundle, nil
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
}

func main() {
	engine := NewFusionEngine()

	// Ingest Anomaly Event
	http.HandleFunc("/api/v1/fusion/ingest", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		w.Header().Set("Content-Type", "application/json")

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

	// Get Single Session State
	http.HandleFunc("/api/v1/fusion/state", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		w.Header().Set("Content-Type", "application/json")

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

	// Get All Active Sessions States (For Examiner Dashboard)
	http.HandleFunc("/api/v1/fusion/states", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		w.Header().Set("Content-Type", "application/json")

		engine.mu.RLock()
		statesList := make([]*AnomalyState, 0, len(engine.activeStates))
		for _, s := range engine.activeStates {
			statesList = append(statesList, s)
		}
		engine.mu.RUnlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"states": statesList,
			"total":  len(statesList),
		})
	})

	// Get Cryptographic SHA-256 Evidence Bundle
	http.HandleFunc("/api/v1/fusion/evidence", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		w.Header().Set("Content-Type", "application/json")

		sessionID := r.URL.Query().Get("session_id")
		if sessionID == "" {
			http.Error(w, `{"error":"missing_session_id"}`, http.StatusBadRequest)
			return
		}

		bundle, err := engine.GenerateEvidenceBundle(sessionID)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(bundle)
	})

	// Examiner Intervention (Warn, Pause, Terminate)
	http.HandleFunc("/api/v1/fusion/intervene", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		w.Header().Set("Content-Type", "application/json")

		var req struct {
			SessionID  string `json:"session_id"`
			Action     string `json:"action"`
			Reason     string `json:"reason"`
			ExaminerID string `json:"examiner_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error":"invalid_intervention_payload"}`, http.StatusBadRequest)
			return
		}

		engine.mu.Lock()
		state, exists := engine.activeStates[req.SessionID]
		if !exists {
			engine.mu.Unlock()
			http.Error(w, `{"error":"session_not_found"}`, http.StatusNotFound)
			return
		}

		intervention := Intervention{
			Action:      req.Action,
			Reason:      req.Reason,
			ExaminerID:  req.ExaminerID,
			TimestampMs: time.Now().UnixMilli(),
		}
		state.Interventions = append(state.Interventions, intervention)
		engine.mu.Unlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":       "INTERVENTION_RECORDED",
			"session_id":   req.SessionID,
			"intervention": intervention,
		})
	})

	// Server-Sent Events (SSE) Stream
	http.HandleFunc("/api/v1/fusion/stream", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
			return
		}

		ch := make(chan *AnomalyState, 10)
		engine.mu.Lock()
		engine.subscribers[ch] = true
		engine.mu.Unlock()

		defer func() {
			engine.mu.Lock()
			delete(engine.subscribers, ch)
			engine.mu.Unlock()
			close(ch)
		}()

		// Send initial heartbeat
		fmt.Fprintf(w, "data: {\"type\":\"CONNECTED\",\"timestamp\":%d}\n\n", time.Now().UnixMilli())
		flusher.Flush()

		ctx := r.Context()
		for {
			select {
			case <-ctx.Done():
				return
			case state := <-ch:
				data, _ := json.Marshal(state)
				fmt.Fprintf(w, "data: %s\n\n", string(data))
				flusher.Flush()
			}
		}
	})

	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"fusion-engine"}`))
	})

	fmt.Println("[Fusion Engine] Temporal decay anomaly engine & SSE listening on :8081...")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
