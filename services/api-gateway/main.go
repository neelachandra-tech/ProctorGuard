package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type SessionVerificationRequest struct {
	SessionID   string `json:"session_id"`
	ExamineeID  string `json:"examinee_id"`
	DeviceToken string `json:"device_token"`
	IsVM        bool   `json:"is_vm"`
}

type SessionVerificationResponse struct {
	Status        string `json:"status"`
	LiveKitToken  string `json:"livekit_token"`
	KafkaStreamID string `json:"kafka_stream_id"`
	MaxDurationMs int64  `json:"max_duration_ms"`
	IssuedAt      int64  `json:"issued_at"`
}

func verifySessionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

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

	resp := SessionVerificationResponse{
		Status:        "VERIFIED_SESSION_ACTIVE",
		LiveKitToken:  fmt.Sprintf("livekit_token_%s_%d", req.ExamineeID, time.Now().Unix()),
		KafkaStreamID: fmt.Sprintf("stream_%s", req.SessionID),
		MaxDurationMs: 10800000, // 3 hours
		IssuedAt:      time.Now().UnixMilli(),
	}

	json.NewEncoder(w).Encode(resp)
}

func main() {
	http.HandleFunc("/api/v1/session/verify", verifySessionHandler)
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"api-gateway"}`))
	})

	log.Println("[API Gateway] Listening on :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Gateway server failed: %v", err)
	}
}
