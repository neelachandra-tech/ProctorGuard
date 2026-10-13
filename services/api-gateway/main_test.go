package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestVerifySessionHandler_Success(t *testing.T) {
	reqBody := SessionVerificationRequest{
		SessionID:    "SESS-TEST-101",
		ExamineeID:   "EX-9001",
		ExamineeName: "Test Student",
		DeviceToken:  "DEV-TOK-77",
		IsVM:         false,
	}

	jsonBytes, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", "/api/v1/session/verify", bytes.NewBuffer(jsonBytes))
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(verifySessionHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp SessionVerificationResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to decode response JSON: %v", err)
	}

	if resp.Status != "VERIFIED_SESSION_ACTIVE" {
		t.Errorf("Unexpected status in response: got %v", resp.Status)
	}
	if resp.SessionJWT == "" {
		t.Errorf("Expected valid session JWT, got empty")
	}
}

func TestVerifySessionHandler_VM_Forbidden(t *testing.T) {
	reqBody := SessionVerificationRequest{
		SessionID:   "SESS-TEST-102",
		ExamineeID:  "EX-9002",
		DeviceToken: "DEV-TOK-88",
		IsVM:        true,
	}

	jsonBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/api/v1/session/verify", bytes.NewBuffer(jsonBytes))
	rr := httptest.NewRecorder()

	handler := http.HandlerFunc(verifySessionHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusForbidden {
		t.Errorf("Expected status HTTP 403 Forbidden for VM, got %v", status)
	}
}

func TestListSessionsHandler(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/v1/sessions", nil)
	rr := httptest.NewRecorder()

	handler := http.HandlerFunc(listSessionsHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Fatalf("Expected status HTTP 200, got %v", status)
	}

	var data map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &data); err != nil {
		t.Fatalf("Failed to parse JSON response: %v", err)
	}

	sessions, ok := data["sessions"].([]interface{})
	if !ok || len(sessions) == 0 {
		t.Errorf("Expected active sessions array, got none")
	}
}

func TestTelemetryEventHandler(t *testing.T) {
	evt := TelemetryEventRequest{
		SessionID:    "SESS-9042",
		ExamineeID:   "EX-9042",
		EventType:    "GAZE_STRAY",
		Severity:     "HIGH",
		Description:  "Candidate turned gaze 35 deg right",
		TimestampMs:  1700000000000,
	}

	jsonBytes, _ := json.Marshal(evt)
	req, _ := http.NewRequest("POST", "/api/v1/telemetry/event", bytes.NewBuffer(jsonBytes))
	rr := httptest.NewRecorder()

	handler := http.HandlerFunc(telemetryEventHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusAccepted {
		t.Errorf("Expected status HTTP 202 Accepted, got %v", status)
	}
}

func TestTelemetryKeystrokeHandler(t *testing.T) {
	kReq := KeystrokeTelemetryRequest{
		SessionID:       "SESS-9042",
		ExamineeID:      "EX-9042",
		AverageDwellMs:  220.0, // High anomaly
		AverageFlightMs: 310.0,
	}

	jsonBytes, _ := json.Marshal(kReq)
	req, _ := http.NewRequest("POST", "/api/v1/telemetry/keystroke", bytes.NewBuffer(jsonBytes))
	rr := httptest.NewRecorder()

	handler := http.HandlerFunc(telemetryKeystrokeHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Fatalf("Expected HTTP 200, got %v", status)
	}

	var data map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &data)
	if data["status"] != "KEYSTROKE_EVALUATED" {
		t.Errorf("Unexpected keystroke status: %v", data["status"])
	}
}
