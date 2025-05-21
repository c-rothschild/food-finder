package main

import (
    "encoding/json"
    "net/http"
    "flag"
    "log"
    "os"
    "googlemaps.github.io/maps"
    "strconv"
    "context"
)

var (
    apiKey = flag.String("key", os.Getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"), "API Key for using Google Maps API.")
)

type Message struct {
    Message string `json:"message"`
}

func enableCORS(w http.ResponseWriter) {
    w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
    w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func nearbyHandler(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)

    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }

    latStr, lngStr := r.URL.Query().Get("lat"), r.URL.Query().Get("lng")
    lat, err := strconv.ParseFloat(latStr, 64)
    if err != nil {
        http.Error(w, "Invalid latitude", http.StatusBadRequest)
        return
    }
    lng, err := strconv.ParseFloat(lngStr, 64)
    if err != nil {
        http.Error(w, "Invalid longitude", http.StatusBadRequest)
        return
    }

    apiKey := os.Getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
    if apiKey == "" {
        http.Error(w, "API Key is required", http.StatusInternalServerError)
        return
    }

    client, err := maps.NewClient(maps.WithAPIKey(apiKey))
    if err != nil {
        http.Error(w, "Failed to create maps client", http.StatusInternalServerError)
        return
    }

    req := &maps.NearbySearchRequest{
        Location: &maps.LatLng{Lat: lat, Lng: lng},
        Radius:   1000,
    }
    results, err := client.NearbySearch(context.Background(), req)
    if err != nil {
        http.Error(w, "Failed to search nearby places", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(results.Results)
}

func check(err error) {
	if err != nil {
		log.Fatalf("fatal error: %s", err)
	}
}

func main() {
    flag.Parse()

    http.HandleFunc("/api/nearby", nearbyHandler)

    log.Println("Server running on :8000")
    log.Fatal(http.ListenAndServe(":8000", nil))
}

