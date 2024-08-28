import { useState, useCallback, useRef, useEffect } from 'react';

interface LocationState {
  coords: GeolocationCoordinates | null;
  error: string | null;
  accuracy: number | null;
  timestamp: number | null;
  isHighAccuracy: boolean;
  provider: string;
  attempts: number;
  status: 'idle' | 'watching' | 'timedOut' | 'done';
}

interface Coordinate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const useDiagnosticGeolocation = (sampleSize = 50, timeout = 30000, accuracyThreshold = 20) => {
  const [state, setState] = useState<LocationState>({
    coords: null,
    error: null,
    accuracy: null,
    timestamp: null,
    isHighAccuracy: false,
    provider: '',
    attempts: 0,
    status: 'idle',
  });

  const coordinatesRef = useRef<Coordinate[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const processSamples = useCallback(() => {
    const sortedCoordinates = coordinatesRef.current.sort((a, b) => a.accuracy - b.accuracy);
    const bestCoordinate = sortedCoordinates[0];

    setState(prev => ({
      ...prev,
      coords: {
        latitude: bestCoordinate.latitude,
        longitude: bestCoordinate.longitude,
        accuracy: bestCoordinate.accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      error: null,
      accuracy: bestCoordinate.accuracy,
      timestamp: bestCoordinate.timestamp,
      isHighAccuracy: bestCoordinate.accuracy <= accuracyThreshold,
      provider: 'GPS (Best of multiple samples)',
      status: 'done',
    }));
  }, [accuracyThreshold]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser', status: 'done' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      error: null, 
      coords: null, 
      accuracy: null, 
      timestamp: null, 
      attempts: prev.attempts + 1,
      status: 'watching'
    }));
    coordinatesRef.current = [];

    const geo_success = (position: GeolocationPosition) => {
      const newCoordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };
      coordinatesRef.current.push(newCoordinate);

      // Update state with the latest coordinate
      setState(prev => ({
        ...prev,
        coords: position.coords,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        isHighAccuracy: position.coords.accuracy <= accuracyThreshold,
      }));

      if (position.coords.accuracy <= accuracyThreshold || coordinatesRef.current.length >= sampleSize) {
        stopWatching();
        processSamples();
      }
    };

    const geo_error = (error: GeolocationPositionError) => {
      console.error('Error getting location:', error);
      stopWatching();
      setState(prev => ({
        ...prev,
        error: `Unable to retrieve your location: ${error.message}`,
        isHighAccuracy: false,
        provider: 'Error',
        status: 'done',
      }));
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      geo_success,
      geo_error,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    timeoutRef.current = setTimeout(() => {
      stopWatching();
      if (coordinatesRef.current.length > 0) {
        processSamples();
      } else {
        setState(prev => ({
          ...prev,
          error: 'Timed out before getting accurate location',
          isHighAccuracy: false,
          provider: 'Timeout',
          status: 'timedOut',
        }));
      }
    }, timeout);

  }, [sampleSize, timeout, accuracyThreshold, stopWatching, processSamples]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return { ...state, getLocation };
};

export default useDiagnosticGeolocation;