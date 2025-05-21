import React, { useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

// Style for the map container
const containerStyle = {
  width: '100%',
  height: '400px'
};

// Blue marker icon URL from Google Maps
const BLUE_MARKER_ICON = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

export default function Home() {
  // State to store fetched places
  const [places, setPlaces] = useState<any[]>([]);
  // State to store user's location
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  // State to store error messages
  const [error, setError] = useState('');
  // State to track which place's InfoWindow is open
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

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
    const response = await fetch(`http://localhost:8000/api/nearby?lat=${location.lat}&lng=${location.lng}&type=restaurant&open_now=true&minprice=1&maxprice=3&radius=1000`);
    const data = await response.json();
    setPlaces(data);
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
      )}
      {/* Button to fetch nearby places, shown only after location is loaded */}
      {isLoaded && location && (
        <button onClick={fetchNearbyPlaces}>Fetch Nearby Places</button>
      )}
    </div>
  );
}
