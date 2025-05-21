import React, { useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

// Style for the map container
const containerStyle = {
  width: '100%',
  height: '400px'
};

// Blue marker icon URL from Google Maps
const BLUE_MARKER_ICON = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

const PRICE_LEVELS = [
  { value: '1', label: '1 (Inexpensive)' },
  { value: '2', label: '2 (Moderate)' },
  { value: '3', label: '3 (Expensive)' },
  { value: '4', label: '4 (Very Expensive)' },
];

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

  return (
    <div style={{ padding: 20 }}>
      <h1>Google Maps Location</h1>
      {/* Button to get user's location */}
      <button onClick={requestLocation}>Get My Location</button>
      {/* Display error messages if any */}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {/* Render the map only when loaded and location is available */}
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
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={location}
          zoom={15}
        >
          {/* User's location marker */}
          <Marker position={location} />
          {/* Render blue markers for each nearby place */}
          {places.map((place, idx) => (
            <Marker
              key={place.place_id || idx}
              position={{ lat: place.geometry.location.lat, lng: place.geometry.location.lng }}
              icon={BLUE_MARKER_ICON}
              onClick={() => setSelectedPlace(place)}
            />
          ))}
          {/* Show InfoWindow with place name when a marker is clicked */}
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
        {/* Show message if search performed and no places found */}
        {searchPerformed && places.length === 0 && (
          <div style={{ color: 'orange', marginTop: 16 }}>No places found for the selected criteria.</div>
        )}
        </>
      )}
    </div>
  );
}
