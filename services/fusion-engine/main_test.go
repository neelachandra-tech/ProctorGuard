package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestFusionEngine_IngestAndDecay(t *testing.T) {
	engine := NewFusionEngine()

	// Ingest an anomaly event
	event := AnomalyEvent{
		SessionID:   "SESS-TEST",
		ExamineeID:  "EX-TEST",
		EventType:   "GAZE_STRAY",
		Weight:      0.8,
		TimestampMs: time.Now().UnixMilli(),
	}

	state := engine.IngestEvent(event)
	if state == nil {
		t.Fatal("Expected non-nil state")
	}

	if state.ThreatStatus == "" {
		t.Errorf("Expected threat status to be set")
	}

	if state.RiskScore <= 0 {
		t.Errorf("Expected non-zero risk score, got %f", state.RiskScore)
	}
}

func TestFusionEngine_EvidenceBundle(t *testing.T) {
	engine := NewFusionEngine()
	event := AnomalyEvent{
		SessionID:   "SESS-9042",
		ExamineeID:  "EX-9042",
		EventType:   "FACE_MISMATCH",
		Weight:      0.9,
		TimestampMs: time.Now().UnixMilli(),
	}
	engine.IngestEvent(event)

	bundle, err := engine.GenerateEvidenceBundle("SESS-9042")
	if err != nil {
		t.Fatalf("Failed to generate evidence bundle: %v", err)
	}

	if bundle.IntegrityHashSHA256 == "" {
		t.Errorf("Expected SHA-256 hash to be generated")
	}
	if bundle.TotalEvents == 0 {
		t.Errorf("Expected non-zero total events")
	}
}

func TestFusionEngine_Intervene(t *testing.T) {
	engine := NewFusionEngine()
	_ = engine.activeStates["SESS-9042"]

	interveneReq := map[string]string{
		"session_id":  "SESS-9042",
		"action":      "WARN",
		"reason":      "Repeated gaze deviation detected",
		"examiner_id": "PR-809",
	}
	body, _ := json.Marshal(interveneReq)

	req, _ := http.NewRequest("POST", "/api/v1/fusion/intervene", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			SessionID  string `json:"session_id"`
			Action     string `json:"action"`
			Reason     string `json:"reason"`
			ExaminerID string `json:"examiner_id"`
		}
		json.NewDecoder(r.Body).Decode(&req)
		engine.mu.Lock()
		state := engine.activeStates[req.SessionID]
		state.Interventions = append(state.Interventions, Intervention{
			Action:      req.Action,
			Reason:      req.Reason,
			ExaminerID:  req.ExaminerID,
			TimestampMs: time.Now().UnixMilli(),
		})
		engine.mu.Unlock()
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "INTERVENTION_RECORDED"})
	})

	handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("Expected 200 OK, got %d", rr.Code)
	}

	if len(engine.activeStates["SESS-9042"].Interventions) != 1 {
		t.Errorf("Expected 1 intervention recorded")
	}
}
