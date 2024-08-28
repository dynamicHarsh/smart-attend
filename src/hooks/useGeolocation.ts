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

const useDiagnosticGeolocation = (sampleSize = 500, timeout = 60000, accuracyThreshold = 3) => {
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

  const calculateWeightedCentroid = useCallback((coordinates: Coordinate[]) => {
    if (coordinates.length === 0) return null;

    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLon = 0;

    coordinates.forEach(coord => {
      const weight = 1 / (coord.accuracy * coord.accuracy); // Use inverse square of accuracy as weight
      totalWeight += weight;
      weightedLat += coord.latitude * weight;
      weightedLon += coord.longitude * weight;
    });

    const finalLat = weightedLat / totalWeight;
    const finalLon = weightedLon / totalWeight;

    // Calculate the average accuracy
    const avgAccuracy = coordinates.reduce((sum, coord) => sum + coord.accuracy, 0) / coordinates.length;

    return {
      latitude: finalLat,
      longitude: finalLon,
      accuracy: avgAccuracy,
      timestamp: Date.now()
    };
  }, []);

  const processSamples = useCallback(() => {
    const centroid = calculateWeightedCentroid(coordinatesRef.current);

    if (!centroid) {
      setState(prev => ({
        ...prev,
        error: 'Unable to calculate position',
        status: 'done',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      coords: {
        latitude: centroid.latitude,
        longitude: centroid.longitude,
        accuracy: centroid.accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      error: null,
      accuracy: centroid.accuracy,
      timestamp: centroid.timestamp,
      isHighAccuracy: centroid.accuracy <= accuracyThreshold,
      provider: 'GPS (Weighted Centroid)',
      status: 'done',
    }));
  }, [calculateWeightedCentroid, accuracyThreshold]);

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

      // Update state with the latest centroid
      const currentCentroid = calculateWeightedCentroid(coordinatesRef.current);
      if (currentCentroid) {
        setState(prev => ({
          ...prev,
          coords: {
            latitude: currentCentroid.latitude,
            longitude: currentCentroid.longitude,
            accuracy: currentCentroid.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          accuracy: currentCentroid.accuracy,
          timestamp: currentCentroid.timestamp,
          isHighAccuracy: currentCentroid.accuracy <= accuracyThreshold,
        }));
      }

      if (coordinatesRef.current.length >= sampleSize) {
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

  }, [sampleSize, timeout, accuracyThreshold, stopWatching, processSamples, calculateWeightedCentroid]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return { ...state, getLocation };
};

export default useDiagnosticGeolocation;