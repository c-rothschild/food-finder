package main

import (
    "encoding/json"
    "net/http"
    "flag"
    "log"
    "os"
    "googlemaps.github.io/maps"
    "strconv"
    "fmt"
    "context"
)

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
        
    }

    // Parse price levels from query params
    minPriceStr := r.URL.Query().Get("minprice")
    maxPriceStr := r.URL.Query().Get("maxprice")
    radiusStr := r.URL.Query().Get("radius")
    placeType := r.URL.Query().Get("type")
    openNow := r.URL.Query().Get("open_now") == "true"

    // Parse minPrice and maxPrice to int
    var radius uint

    if radiusStr != "" {
        if v, err := strconv.ParseUint(radiusStr, 10, 32); err == nil {
            radius = uint(v)
        }
    }

    parsePriceLevels(minPriceStr, maxPriceStr, req, w)

    req.Radius = radius

    // Parse place type from query params
    parsePlaceType(placeType, req)

    
    req.OpenNow = openNow

    
    // Perform the Nearby Search
    results, err := client.NearbySearch(context.Background(), req)
    if err != nil {
        http.Error(w, "Failed to search nearby places", http.StatusInternalServerError)
        return
    }

    // Return the results as JSON
    json.NewEncoder(w).Encode(results.Results)
}


func parsePriceLevel(priceLevel string, w http.ResponseWriter) maps.PriceLevel {
	switch priceLevel {
	case "0":
		return maps.PriceLevelFree
	case "1":
		return maps.PriceLevelInexpensive
	case "2":
		return maps.PriceLevelModerate
	case "3":
		return maps.PriceLevelExpensive
	case "4":
		return maps.PriceLevelVeryExpensive
	default:
		http.Error(w, "Unknown price level", http.StatusInternalServerError)
	}
	return maps.PriceLevelFree
}

func parsePriceLevels(minPriceStr string, maxPriceStr string, r *maps.NearbySearchRequest, w http.ResponseWriter) {
	if minPriceStr != "" {
		r.MinPrice = parsePriceLevel(minPriceStr, w)
	}

	if maxPriceStr != "" {
		r.MaxPrice = parsePriceLevel(minPriceStr, w)
	}
}

func parsePlaceType(placeType string, r *maps.NearbySearchRequest) {
	if placeType != "" {
		t, err := maps.ParsePlaceType(placeType)
		if err != nil {
			usageAndExit(fmt.Sprintf("Unknown place type \"%v\"", placeType))
		}

		r.Type = t
	}
}

func main() {
    flag.Parse()

    // Register the /api/nearby endpoint
    http.HandleFunc("/api/nearby", nearbyHandler)

    log.Println("Server running on :8000")
    log.Fatal(http.ListenAndServe(":8000", nil))
}
func usageAndExit(msg string) {
	fmt.Fprintln(os.Stderr, msg)
	fmt.Println("Flags:")
	flag.PrintDefaults()
	os.Exit(2)
}

