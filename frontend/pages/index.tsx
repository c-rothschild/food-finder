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

export default function Home() {
  // State to store fetched places
  const [places, setPlaces] = useState<any[]>([]);
  // State to store user's location
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  // State to store error messages
  const [error, setError] = useState('');
  // State to track which place's InfoWindow is open
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
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
  const getGoogleMapsLink = (place: any) => {
    if (place.place_id) {
      return `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
    }
    return '';
  };

  // Helper to show address/location (instead of travel time)
  const getPlaceAddress = (place: any) => {
    if (place.vicinity) return place.vicinity;
    if (place.formatted_address) return place.formatted_address;
    return '';
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Find Restaurants Near You</h1>
      <button onClick={requestLocation}>Get My Location</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {isLoaded && location && (
        <>
        <div style={{ margin: '10px 0' }}>
            <label>
              Min Price:
              <select value={minPrice} onChange={handleMinPriceChange} style={{ marginLeft: 8, marginRight: 16 }}>
                {minPriceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <label>
              Max Price:
              <select value={maxPrice} onChange={handleMaxPriceChange} style={{ marginLeft: 8, marginRight: 16 }}>
                {maxPriceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <label>
              Radius (meters):
              <input
                type="number"
                min={1}
                value={radius}
                onChange={handleRadiusChange}
                style={{ marginLeft: 8, width: 100 }}
              />
            </label>
            <button onClick={fetchNearbyPlaces}>Fetch Nearby Places</button>
          </div>
        {/* Sticky map container */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', paddingBottom: 16 }}>
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
        {/* Show message if search performed and no places found */}
        {searchPerformed && places.length === 0 && (
          <div style={{ color: 'orange', marginTop: 16 }}>No places found for the selected criteria.</div>
        )}
        {/* Scrollable results list */}
        {places.length > 0 && (
          <div style={{ marginTop: 24, maxHeight: 400, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, background: '#fafafa', padding: 16 }}>
            <h2>Results</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {places.map((place, idx) => (
                <li
                  key={place.place_id || idx}
                  style={{
                    marginBottom: 16,
                    borderBottom: '1px solid #eee',
                    paddingBottom: 8,
                    background: selectedPlace && (selectedPlace.place_id === place.place_id) ? '#ffeaea' : 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedPlace(place)}
                >
                  <strong>{place.name}</strong><br />
                  {place.rating && <span>Rating: {place.rating} ⭐</span>}<br />
                  {typeof place.price_level !== 'undefined' && <span>Price: {priceLevelToDollarSigns(place.price_level)}</span>}<br />
                  {getPlaceAddress(place) && <span>Location: {getPlaceAddress(place)}</span>}<br />
                  <a href={getGoogleMapsLink(place)} target="_blank" rel="noopener noreferrer">View on Google Maps</a>
                </li>
              ))}
            </ul>
          </div>
        )}
        </>
      )}
    </div>
  );
}
