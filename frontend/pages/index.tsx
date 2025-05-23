import React, { useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

// Style for the map container
const containerStyle = {
  width: '100%',
  height: '400px'
};

// Blue marker icon URL from Google Maps
const BLUE_MARKER_ICON = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
const RED_MARKER_ICON = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

const PRICE_LEVELS = [
  { value: '1', label: '1 (Inexpensive)' },
  { value: '2', label: '2 (Moderate)' },
  { value: '3', label: '3 (Expensive)' },
  { value: '4', label: '4 (Very Expensive)' },
];

// Helper to convert price level to $ signs
function priceLevelToDollarSigns(level: number | undefined) {
  if (typeof level !== 'number') return '';
  return '$'.repeat(level + 1);
}

// TypeScript type for a Google Places API result (as returned by backend)
export interface Place {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  vicinity?: string;
  formatted_address?: string;
  user_ratings_total?: number;
  types?: string[];
  business_status?: string;
  opening_hours?: {
    open_now?: boolean;
  };
}

export default function Home() {
  // State to store fetched places
  const [places, setPlaces] = useState<Place[]>([]);
  // State to store user's location
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  // State to store error messages
  const [error, setError] = useState('');
  // State to track which place's InfoWindow is open
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  // State for minprice and maxprice selection
  const [minPrice, setMinPrice] = useState('1');
  const [maxPrice, setMaxPrice] = useState('4');
  const [searchPerformed, setSearchPerformed] = useState(false); // Track if search was performed
  const [radius, setRadius] = useState(1000); // Search radius in meters

  // Load the Google Maps JavaScript API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  // Request the user's current location using the browser's Geolocation API
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setError('');
      },
      () => setError('Unable to retrieve your location')
    );
  };

  // Fetch nearby places from the backend using the user's location
  const fetchNearbyPlaces = async () => {
    if (!location) return;
    setSearchPerformed(false); // Reset before search
    const response = await fetch(`http://localhost:8000/api/nearby?lat=${location.lat}&lng=${location.lng}&type=restaurant&open_now=true&minprice=${minPrice}&maxprice=${maxPrice}&radius=${radius}`);
    const data = await response.json();
    setPlaces(data);
    setSearchPerformed(true); // Mark that a search was performed
  };

  // Filtered options for min and max price
  const minPriceOptions = PRICE_LEVELS.filter(opt => parseInt(opt.value) <= parseInt(maxPrice));
  const maxPriceOptions = PRICE_LEVELS.filter(opt => parseInt(opt.value) >= parseInt(minPrice));

  // Handlers to keep minPrice <= maxPrice and maxPrice >= minPrice
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMin = e.target.value;
    setMinPrice(newMin);
    if (parseInt(newMin) > parseInt(maxPrice)) {
      setMaxPrice(newMin);
    }
  };
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMax = e.target.value;
    setMaxPrice(newMax);
    if (parseInt(newMax) < parseInt(minPrice)) {
      setMinPrice(newMax);
    }
  };
  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setRadius(value);
    } else if (e.target.value === '') {
      setRadius(0);
    }
  };

  // Helper to get Google Maps link for a place
  const getGoogleMapsLink = (place: Place) => {
    if (place.place_id) {
      return `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
    }
    return '';
  };

  // Helper to show address/location (instead of travel time)
  const getPlaceAddress = (place: Place) => {
    if (place.vicinity) return place.vicinity;
    if (place.formatted_address) return place.formatted_address;
    return '';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', padding: 0, margin: 0 }}>
      <div style={{
        maxWidth: 700,
        margin: '32px auto',
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: 32,
        position: 'relative',
      }}>
        <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: 32, color: '#2d3748', marginBottom: 24 }}>Find Restaurants Near You</h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <button
            onClick={requestLocation}
            style={{
              background: 'linear-gradient(90deg, #4f8cff 0%, #38b2ac 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79,140,255,0.08)',
              transition: 'background 0.2s',
              marginRight: 8
            }}
          >
            Get My Location
          </button>
          <button
            onClick={fetchNearbyPlaces}
            style={{
              background: 'linear-gradient(90deg, #38b2ac 0%, #4f8cff 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(56,178,172,0.08)',
              transition: 'background 0.2s',
            }}
          >
            Fetch Nearby Places
          </button>
        </div>
        {error && <div style={{ color: '#e53e3e', background: '#fff5f5', borderRadius: 6, padding: 8, marginBottom: 16, textAlign: 'center' }}>{error}</div>}
        {isLoaded && location && (
          <>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <label style={{ fontWeight: 500, color: '#2d3748' }}>
                Min Price:
                <select
                  value={minPrice}
                  onChange={handleMinPriceChange}
                  style={{
                    marginLeft: 8,
                    marginRight: 16,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    padding: '6px 12px',
                    fontSize: 15,
                  }}
                >
                  {minPriceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontWeight: 500, color: '#2d3748' }}>
                Max Price:
                <select
                  value={maxPrice}
                  onChange={handleMaxPriceChange}
                  style={{
                    marginLeft: 8,
                    marginRight: 16,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    padding: '6px 12px',
                    fontSize: 15,
                  }}
                >
                  {maxPriceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontWeight: 500, color: '#2d3748' }}>
                Radius (meters):
                <input
                  type="number"
                  min={1}
                  value={radius}
                  onChange={handleRadiusChange}
                  style={{
                    marginLeft: 8,
                    width: 100,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    padding: '6px 12px',
                    fontSize: 15,
                  }}
                />
              </label>
            </div>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', paddingBottom: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={location}
                zoom={15}
              >
                <Marker position={location} />
                {places.map((place, idx) => (
                  <Marker
                    key={place.place_id || idx}
                    position={{ lat: place.geometry.location.lat, lng: place.geometry.location.lng }}
                    icon={selectedPlace && (selectedPlace.place_id === place.place_id) ? RED_MARKER_ICON : BLUE_MARKER_ICON}
                    onClick={() => setSelectedPlace(place)}
                  />
                ))}
                {selectedPlace && (
                  <InfoWindow
                    position={{
                      lat: selectedPlace.geometry.location.lat,
                      lng: selectedPlace.geometry.location.lng
                    }}
                    onCloseClick={() => setSelectedPlace(null)}
                  >
                    <div>{selectedPlace.name}</div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
            {searchPerformed && places.length === 0 && (
              <div style={{ color: '#e53e3e', background: '#fff5f5', borderRadius: 6, padding: 12, marginTop: 16, textAlign: 'center' }}>No places found for the selected criteria.</div>
            )}
            {places.length > 0 && (
              <div style={{
                marginTop: 24,
                maxHeight: 400,
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: '#f7fafc',
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: '#2d3748', marginBottom: 16 }}>Results</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {places.map((place, idx) => (
                    <li
                      key={place.place_id || idx}
                      style={{
                        marginBottom: 16,
                        borderBottom: '1px solid #e2e8f0',
                        paddingBottom: 8,
                        background: selectedPlace && (selectedPlace.place_id === place.place_id) ? '#e6fffa' : 'transparent',
                        cursor: 'pointer',
                        borderRadius: 8,
                        padding: 12,
                        transition: 'background 0.2s',
                      }}
                      onClick={() => setSelectedPlace(place)}
                    >
                      <strong style={{ fontSize: 18, color: '#2b6cb0' }}>{place.name}</strong><br />
                      {place.rating && <span style={{ color: '#805ad5' }}>Rating: {place.rating} ⭐</span>}<br />
                      {typeof place.price_level !== 'undefined' && <span style={{ color: '#2f855a' }}>Price: {priceLevelToDollarSigns(place.price_level)}</span>}<br />
                      {getPlaceAddress(place) && <span style={{ color: '#4a5568' }}>Location: {getPlaceAddress(place)}</span>}<br />
                      <a href={getGoogleMapsLink(place)} target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline', fontWeight: 500 }}>View on Google Maps</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
