import React, { useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

// Blue marker icon URL from Google Maps
const BLUE_MARKER_ICON = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

export default function Home() {
  const [places, setPlaces] = useState<any[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

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

  const fetchNearbyPlaces = async () => {
    if (!location) return;
    const response = await fetch(`http://localhost:8000/api/nearby?lat=${location.lat}&lng=${location.lng}`);
    const data = await response.json();
    setPlaces(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Google Maps Location</h1>
      <button onClick={requestLocation}>Get My Location</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {isLoaded && location && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={location}
          zoom={15}
        >
          {/* User's location marker */}
          <Marker position={location} />
          {/* Nearby places as blue markers with InfoWindow */}
          {places.map((place, idx) => (
            <Marker
              key={place.place_id || idx}
              position={{ lat: place.geometry.location.lat, lng: place.geometry.location.lng }}
              icon={BLUE_MARKER_ICON}
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
      )}
      {isLoaded && location && (
        <button onClick={fetchNearbyPlaces}>Fetch Nearby Places</button>
      )}
    </div>
  );
}
