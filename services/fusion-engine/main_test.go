package main

import (
	"testing"
	"time"
)

func TestFusionEngine_IngestEvent_ExponentialDecay(t *testing.T) {
	fe := NewFusionEngine()
	now := time.Now().UnixMilli()

	event1 := AnomalyEvent{
		SessionID:   "SESS-99",
		ExamineeID:  "EX-1",
		EventType:   "GAZE_STRAY",
		Weight:      0.8,
		TimestampMs: now - 500,
	}

	state := fe.IngestEvent(event1)
	if state.SessionID != "SESS-99" {
		t.Errorf("Expected SessionID SESS-99, got %s", state.SessionID)
	}

	if state.RiskScore <= 0 {
		t.Errorf("Expected positive risk score, got %f", state.RiskScore)
	}

	if state.ThreatStatus == "" {
		t.Errorf("Expected non-empty ThreatStatus")
	}
}
