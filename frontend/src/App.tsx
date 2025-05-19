import React, { useEffect, useState } from 'react';
import './App.css';

interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

function App() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const getLocationDetails = async (latitude: number, longitude: number) => {
    try {
      // Use reverse geocoding to get city and country
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      setLocation({
        latitude,
        longitude,
        city: data.city || 'Unknown city',
        country: data.countryName || 'Unknown country'
      });
    } catch (err) {
      setError('Failed to get location details');
      setLocation({
        latitude,
        longitude,
        city: 'Unknown city',
        country: 'Unknown country'
      });
    }
  };

  const requestLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        getLocationDetails(position.coords.latitude, position.coords.longitude);
        setLoading(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Please allow location access to use this feature');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setError('Location request timed out');
            break;
          default:
            setError('An unknown error occurred');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="App" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Location Finder</h1>
      
      {!location && !loading && (
        <button 
          onClick={requestLocation}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Get My Location
        </button>
      )}

      {loading && <div>Getting your location...</div>}
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}

      {location && (
        <div style={{ marginTop: '20px' }}>
          <h2>Your Location:</h2>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p><strong>City:</strong> {location.city}</p>
            <p><strong>Country:</strong> {location.country}</p>
            <p><strong>Latitude:</strong> {location.latitude.toFixed(6)}</p>
            <p><strong>Longitude:</strong> {location.longitude.toFixed(6)}</p>
          </div>
          <button 
            onClick={requestLocation} 
            style={{
              marginTop: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Location
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
