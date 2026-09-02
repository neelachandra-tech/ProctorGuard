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
		SessionID:   "SESS-TEST-101",
		ExamineeID:  "EX-9001",
		DeviceToken: "DEV-TOK-77",
		IsVM:        false,
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
