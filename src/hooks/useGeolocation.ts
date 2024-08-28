import { useState, useCallback } from 'react';

interface LocationState {
  coords: GeolocationCoordinates | null;
  error: string | null;
  accuracy: number | null;
  timestamp: number | null;
  isHighAccuracy: boolean;
  provider: string;
  attempts: number;
}

 const useDiagnosticGeolocation = () => {
  const [state, setState] = useState<LocationState>({
    coords: null,
    error: null,
    accuracy: null,
    timestamp: null,
    isHighAccuracy: false,
    provider: '',
    attempts: 0,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setState(prev => ({ ...prev, error: null, coords: null, accuracy: null, timestamp: null, attempts: prev.attempts + 1 }));

    const geo_success = (position: GeolocationPosition) => {
      setState(prev => ({
        coords: position.coords,
        error: null,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        isHighAccuracy: position.coords.accuracy < 100,
        provider: 'GPS',
        attempts: prev.attempts,
      }));
    };

    const geo_error = (error: GeolocationPositionError) => {
      console.error('Error getting location:', error);
      setState(prev => ({
        ...prev,
        error: `Unable to retrieve your location: ${error.message}`,
        isHighAccuracy: false,
        provider: 'Error',
      }));

      // Fallback to low accuracy if high accuracy fails
      if (error.code === error.TIMEOUT) {
        navigator.geolocation.getCurrentPosition(
          position => {
            setState(prev => ({
              coords: position.coords,
              error: null,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              isHighAccuracy: position.coords.accuracy < 100,
              provider: 'GPS (Low Accuracy)',
              attempts: prev.attempts,
            }));
          },
          fallbackError => setState(prev => ({
            ...prev,
            error: `Fallback location failed: ${fallbackError.message}`,
            isHighAccuracy: false,
            provider: 'Error',
          })),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      }
    };

    // Try high accuracy first
    navigator.geolocation.getCurrentPosition(
      geo_success,
      error => {
        console.log('High accuracy failed, trying low accuracy');
        // If high accuracy fails, try low accuracy
        navigator.geolocation.getCurrentPosition(
          geo_success,
          geo_error,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { ...state, getLocation };
};

export default useDiagnosticGeolocation