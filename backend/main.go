package main

import (
    "encoding/json"
    "net/http"
    "log"
)

type Message struct {
    Message string `json:"message"`
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        next(w, r)
    }
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(Message{Message: "Hello from Go!"})
}

func main() {
    http.HandleFunc("/api/hello", enableCORS(helloHandler))
    log.Println("Server running on :8000")
    log.Fatal(http.ListenAndServe(":8000", nil))
}