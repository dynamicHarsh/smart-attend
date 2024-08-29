// lib/geolocation.ts

export interface GeolocationResult {
    coords: {
      latitude: number;
      longitude: number;
      accuracy: number;
    } | null;
    error: string | null;
  }
  
  export async function getGeolocation(): Promise<GeolocationResult> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return { coords: null, error: 'Geolocation is not supported' };
    }
  
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
            error: null,
          });
        },
        (error) => {
          resolve({ coords: null, error: error.message });
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      );
    });
  }
  
  export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d * 1000; // Convert to meters
  }
  
  function deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }