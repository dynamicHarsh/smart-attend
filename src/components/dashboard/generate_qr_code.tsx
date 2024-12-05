"use client"
import React, { useState, useEffect, useRef } from 'react';
import { generateAttendanceLink, killAttendanceSession } from '@/lib/actions';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from '@/hooks/use-toast';

const LOW_FREQ = 19000;
const HIGH_FREQ = 19400;

interface Props {
  teacherId: string;
  courseId: string;
}

interface LocationState {
  accuracy: number;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export default function GenerateLinkComponent({ teacherId, courseId }: Props) {
  const [linkData, setLinkData] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [domain, setDomain] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isEmitting, setIsEmitting] = useState(false);
  const [generatedFrequency, setGeneratedFrequency] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [attendanceLinkId,setAttendanceLinkId]=useState("");
  const [permissions, setPermissions] = useState({
    geolocation: false,
    speaker: false
  });
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationProgress, setLocationProgress] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_LOCATION_TIME = 5000; // 30 seconds
  const DESIRED_ACCURACY = 20; // 20 meters
  type CustomPosition = {
    coords: {
        latitude: number;
        longitude: number;
        accuracy: number;
        altitude: number | null;
        altitudeAccuracy: number | null;
        heading: number | null;
        speed: number | null;
    };
    timestamp: number;
};

  const getLocationPromise = () => {
    return new Promise<CustomPosition>((resolve, reject) => {
      let bestLocation: LocationState | null = null;
      setIsGettingLocation(true);
      setLocationProgress(0);
      setLocationMessage('Initializing location services...');

      // Start a timer to update the progress bar
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed / MAX_LOCATION_TIME) * 100;
        setLocationProgress(Math.min(progress, 100));
      }, 100);

      // Watch for location updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            accuracy: position.coords.accuracy,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp
          };

          setCurrentLocation(newLocation);
          
          // Update message based on accuracy
          if (newLocation.accuracy > 100) {
            setLocationMessage(`Getting approximate location... (Accuracy: ${Math.round(newLocation.accuracy)}m)`);
          } else if (newLocation.accuracy > DESIRED_ACCURACY) {
            setLocationMessage(`Improving location accuracy... (Accuracy: ${Math.round(newLocation.accuracy)}m)`);
          } else {
            setLocationMessage(`High accuracy achieved! (Accuracy: ${Math.round(newLocation.accuracy)}m)`);
          }

          // Update best location if this is more accurate
          if (!bestLocation || newLocation.accuracy < bestLocation.accuracy) {
            bestLocation = newLocation;
          }

          // If we've reached desired accuracy, resolve immediately
          if (newLocation.accuracy <= DESIRED_ACCURACY) {
            cleanupLocation();
            resolve(position);
          }
        },
        (error) => {
          const errorMessage = getGeolocationErrorMessage(error);
          setLocationError(errorMessage);
          cleanupLocation();
          reject(error);
        },
        { 
          enableHighAccuracy: true,
          timeout: MAX_LOCATION_TIME,
          maximumAge: 0
        }
      );

      // Set a timeout to resolve with best location after MAX_LOCATION_TIME
      locationTimeoutRef.current = setTimeout(() => {
        cleanupLocation();
        if (bestLocation) {
          // Create a position object from our best location
          const position:CustomPosition = {
            coords: {
              latitude: bestLocation.latitude,
              longitude: bestLocation.longitude,
              accuracy: bestLocation.accuracy,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: bestLocation.timestamp
          };
          resolve(position);
        } else {
          reject(new Error('Could not get accurate location within timeout'));
        }
      }, MAX_LOCATION_TIME);

      // Cleanup function
      const cleanupLocation = () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (locationTimeoutRef.current !== null) {
          clearTimeout(locationTimeoutRef.current);
          locationTimeoutRef.current = null;
        }
        clearInterval(progressInterval);
        setIsGettingLocation(false);
        setLocationProgress(100);
      };
    });
  };

  const getGeolocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location permission denied. Please enable location access.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable.";
      case error.TIMEOUT:
        return "Location request timed out.";
      default:
        return "An unknown error occurred while getting location.";
    }
  };

  useEffect(() => {
    setDomain(window.location.origin);
    return () => {
      stopFrequency();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (locationTimeoutRef.current !== null) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, []);

  const generateRandomFrequency = (): number => {
    return Math.floor(Math.random() * (HIGH_FREQ - LOW_FREQ + 1)) + LOW_FREQ;
  };

  const checkPermissions = async () => {
    setIsCheckingPermissions(true);
    try {
      const geoPermission = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false)
        );
      });

      const speakerPermission = await new Promise((resolve) => {
        try {
          const testContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          testContext.close();
          resolve(true);
        } catch {
          resolve(false);
        }
      });

      setPermissions({
        geolocation: geoPermission as boolean,
        speaker: speakerPermission as boolean
      });

      return geoPermission && speakerPermission;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const stopFrequency = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsEmitting(false);
  };

  const startFrequencyEmission = (frequency: number) => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNodeRef.current.connect(audioContextRef.current.destination);

    oscillatorRef.current = audioContextRef.current.createOscillator();
    oscillatorRef.current.type = 'sine';
    oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    oscillatorRef.current.connect(gainNodeRef.current);
    oscillatorRef.current.start();
    setIsEmitting(true);
  };

  const handleTakeAttendance = async () => {
    // If currently emitting, stop the session
    if (isEmitting) {
      try {
        await killAttendanceSession(attendanceLinkId);
        stopFrequency();
        toast({
          title: 'Attendance Session Stopped',
          description: 'The attendance session has been terminated.',
          variant: 'default'
        });
        setGeneratedFrequency(null);
        return;
      } catch (error) {
        toast({
          title: 'Error Stopping Attendance',
          description: 'Failed to stop the attendance session.',
          variant: 'destructive'
        });
        return;
      }
    }

    // Check and request permissions
    const hasPermissions = await checkPermissions();
    if (!hasPermissions) {
      toast({
        title: 'Permission Denied',
        description: 'Please grant location and speaker permissions.',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingLink(true);
    try {
      const position = await getLocationPromise();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const frequency = generateRandomFrequency();
      setGeneratedFrequency(frequency);
      
      const result = await generateAttendanceLink(teacherId, courseId, latitude, longitude, frequency);
      if (result.success) {
        const url = `${domain}/dashboard/student/courses/${courseId}/mark_attendance?linkId=${result.linkId}`;
        setLinkData(url);
        setExpiresAt(new Date(result.expiresAt));
        setIsExpired(false);
        setAttendanceLinkId(result.linkId);
        
        startFrequencyEmission(frequency);
        
        toast({
          title: 'Attendance Started',
          description: 'Attendance link generated and frequency emission started.',
          variant: 'default'
        });
      } else {
        toast({
          
          title: 'Error Generating Link',
          description: result.error || 'Failed to generate attendance link.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Attendance Error',
        description: 'An error occurred while taking attendance.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Attendance System</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleTakeAttendance}
          className="w-full"
          disabled={isCheckingPermissions || isGettingLocation}
          variant={isEmitting ? "destructive" : "default"}
        >
          {isCheckingPermissions ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Permissions...
            </>
          ) : isGettingLocation ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Location...
            </>
          ) : isEmitting ? (
            <>
              <Volume2 className="mr-2 h-4 w-4" />
              Stop Taking Attendance
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Take Attendance
            </>
          )}
        </Button>

        {isGettingLocation && (
          <div className="space-y-2">
            <Progress value={locationProgress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">{locationMessage}</p>
            {currentLocation && (
              <p className="text-xs text-center text-muted-foreground">
                Current accuracy: {Math.round(currentLocation.accuracy)}
              </p>
            )}
          </div>
        )}

        {generatedFrequency && (
          <div className="text-center text-sm text-muted-foreground">
            Frequency Emission Active: {generatedFrequency} Hz
          </div>
        )}

        {locationError && (
          <div className="text-center text-sm text-destructive">
            {locationError}
          </div>
        )}

        {!permissions.geolocation && (
          <div className="text-center text-sm text-destructive">
            Geolocation permission is required for attendance.
          </div>
        )}

        {!permissions.speaker && (
          <div className="text-center text-sm text-destructive">
            Speaker access is required for frequency emission.
          </div>
        )}
      </CardContent>
    </Card>
  );
}