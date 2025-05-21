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

// apiKey is set from the environment variable or command-line flag
var (
    apiKey = flag.String("key", os.Getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"), "API Key for using Google Maps API.")
)

// Message is a simple struct for hello endpoint responses
// (not currently used, but kept for example/expansion)
type Message struct {
    Message string `json:"message"`
}

// enableCORS sets CORS headers to allow requests from the frontend
func enableCORS(w http.ResponseWriter) {
    w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
    w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// nearbyHandler handles GET requests to /api/nearby and returns nearby places from Google Maps
func nearbyHandler(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)

    // Handle preflight OPTIONS request
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }

    // Parse latitude and longitude from query params
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

    // Get API key from environment
    apiKey := os.Getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
    if apiKey == "" {
        http.Error(w, "API Key is required", http.StatusInternalServerError)
        return
    }

    // Create Google Maps client
    client, err := maps.NewClient(maps.WithAPIKey(apiKey))
    if err != nil {
        http.Error(w, "Failed to create maps client", http.StatusInternalServerError)
        return
    }

    // Build the Nearby Search request
    req := &maps.NearbySearchRequest{
        Location: &maps.LatLng{Lat: lat, Lng: lng},
        Radius:   1000, // meters
    }
    // Perform the Nearby Search
    results, err := client.NearbySearch(context.Background(), req)
    if err != nil {
        http.Error(w, "Failed to search nearby places", http.StatusInternalServerError)
        return
    }

    // Return the results as JSON
    json.NewEncoder(w).Encode(results.Results)
}

// check is a helper to log fatal errors (not currently used)
func check(err error) {
	if err != nil {
		log.Fatalf("fatal error: %s", err)
	}
}

func main() {
    flag.Parse()

    // Register the /api/nearby endpoint
    http.HandleFunc("/api/nearby", nearbyHandler)

    log.Println("Server running on :8000")
    log.Fatal(http.ListenAndServe(":8000", nil))
}

