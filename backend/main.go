package main

import (
    "encoding/json"
    "net/http"
    "log"
)

type Message struct {
    Message string `json:"message"`
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    // Allow CORS for local development
    w.Header().Set("Access-Control-Allow-Origin", "*")
    json.NewEncoder(w).Encode(Message{Message: "Hello from Go!"})
}

func main() {
    http.HandleFunc("/api/hello", helloHandler)
    log.Println("Server running on :8000")
    log.Fatal(http.ListenAndServe(":8000", nil))
}
