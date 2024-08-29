// lib/geolocation.ts

interface Coordinate {
    latitude: number;
    longitude: number;
    accuracy: number;
  }
  
  export async function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      }
    });
  }
  
  export async function getAccuratePosition(
    sampleSize: number = 5,
    timeout: number = 10000,
    accuracyThreshold: number = 10
  ): Promise<Coordinate> {
    const startTime = Date.now();
    const coordinates: Coordinate[] = [];
  
    while (coordinates.length < sampleSize && Date.now() - startTime < timeout) {
      try {
        const position = await getCurrentPosition({ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
        coordinates.push({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
  
        if (position.coords.accuracy <= accuracyThreshold) {
          return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    }
  
    if (coordinates.length === 0) {
      throw new Error('Unable to get accurate location');
    }
  
    // Calculate weighted average
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLon = 0;
    let totalAccuracy = 0;
  
    coordinates.forEach(coord => {
      const weight = 1 / (coord.accuracy * coord.accuracy);
      totalWeight += weight;
      weightedLat += coord.latitude * weight;
      weightedLon += coord.longitude * weight;
      totalAccuracy += coord.accuracy;
    });
  
    return {
      latitude: weightedLat / totalWeight,
      longitude: weightedLon / totalWeight,
      accuracy: totalAccuracy / coordinates.length
    };
  }