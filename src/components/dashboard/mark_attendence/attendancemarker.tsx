"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getAttendanceButton, markAttendance } from '@/lib/actions';
import SuccessComponent from './attendence_success';
import { AttendanceStatus } from '@prisma/client';

// Constants for audio processing
const SAMPLE_RATE = 48000;
const FFT_SIZE = 32768;
const LOW_FREQ = 18999;  // Low end of the frequency range
const HIGH_FREQ = 19401; // High end of the frequency range
const LISTENING_DURATION = 7000; // 5 seconds
const MAX_LOCATION_TIME = 13000; // 15 seconds
const DESIRED_ACCURACY = 5; // 20 meters

type FrequencyDataPoint = {
  freq: number;
  magnitude: number;
};

type AttendanceResult = {
  success: string;
  isPotentialProxy: boolean;
  status: AttendanceStatus;
};

export default function SimplifiedAttendanceMarker({ 
  courseId,
  studentId
}: {
  courseId: string,
  studentId: string
}) {
  // States for the entire flow
  const [step, setStep] = useState<'initial' | 'location' | 'frequency' | 'submitting' | 'completed'>('initial');
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [detectedFrequency, setDetectedFrequency] = useState<FrequencyDataPoint>({freq:0, magnitude:-1000});
  const [success, setSuccess] = useState<AttendanceResult | null>(null);

  // Location states
  const [locationError, setLocationError] = useState('');
  const [locationProgress, setLocationProgress] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{
    accuracy: number;
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null>(null);
  const [locationMessage, setLocationMessage] = useState('');

  // Refs for cleanup
  const watchIdRef = useRef<number | null>(null);
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

  // Cleanup functions
  const cleanupLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (locationTimeoutRef.current !== null) {
      clearTimeout(locationTimeoutRef.current);
      locationTimeoutRef.current = null;
    }
  };

  const cleanupAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Initial check for attendance availability
  useEffect(() => {
    const checkAttendance = async () => {
      try {
        const result = await getAttendanceButton(studentId, courseId);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (!result.show) {
          setError("No active attendance session");
          return;
        }
        setAttendanceData(result);
      } catch (err) {
        setError("Failed to check attendance availability");
      }
    };

    checkAttendance();

    return () => {
      cleanupLocation();
      cleanupAudio();
    };
  }, [studentId, courseId]);

  // Geolocation error handling
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

  // Location verification promise
  const getLocationPromise = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      let bestLocation: GeolocationPosition | null = null;
      setStep('location');
      setLocationProgress(0);
      setLocationMessage('Initializing location services...');

      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed / MAX_LOCATION_TIME) * 100;
        setLocationProgress(Math.min(progress, 100));
      }, 100);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            accuracy: position.coords.accuracy,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp
          };

          setCurrentLocation(newLocation);
          
          if (newLocation.accuracy > 100) {
            setLocationMessage(`Getting approximate location... (Accuracy: ${Math.round(newLocation.accuracy)}m)`);
          } else if (newLocation.accuracy > DESIRED_ACCURACY) {
            setLocationMessage(`Improving location accuracy... (Accuracy: ${Math.round(newLocation.accuracy)}m)`);
          } else {
            setLocationMessage(`High accuracy achieved! (Accuracy: ${Math.round(newLocation.accuracy)}m)`);
          }

          if (!bestLocation || position.coords.accuracy < bestLocation.coords.accuracy) {
            bestLocation = position;
          }

          if (position.coords.accuracy <= DESIRED_ACCURACY) {
            cleanupLocationTracking();
            resolve(position);
          }
        },
        (error) => {
          const errorMessage = getGeolocationErrorMessage(error);
          setLocationError(errorMessage);
          cleanupLocationTracking();
          reject(error);
        },
        { 
          enableHighAccuracy: true,
          timeout: MAX_LOCATION_TIME,
          maximumAge: 0
        }
      );

      locationTimeoutRef.current = setTimeout(() => {
        cleanupLocationTracking();
        if (bestLocation) {
          resolve(bestLocation);
        } else {
          reject(new Error('Could not get accurate location within timeout'));
        }
      }, MAX_LOCATION_TIME);

      const cleanupLocationTracking = () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (locationTimeoutRef.current !== null) {
          clearTimeout(locationTimeoutRef.current);
          locationTimeoutRef.current = null;
        }
        clearInterval(progressInterval);
        setLocationProgress(100);
      };
    });
  };

  // Frequency detection logic
  const detectFrequency = () => {
    return new Promise<FrequencyDataPoint>((resolve, reject) => {
      setStep('frequency');
      
      const startListening = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 1,
              sampleRate: SAMPLE_RATE
            }
          });

          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = FFT_SIZE;
          analyserRef.current.smoothingTimeConstant = 0.5;

          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          streamRef.current = stream;

          let detectedFreq: FrequencyDataPoint = {freq: 0, magnitude: -1000};

          const processAudioData = () => {
            if (!analyserRef.current) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);
            analyserRef.current.getFloatFrequencyData(dataArray);

            const frequencyBinSize = SAMPLE_RATE / FFT_SIZE;
          
            const newData: FrequencyDataPoint[] = [];
            const startIndex = Math.floor(LOW_FREQ / frequencyBinSize);
            const endIndex = Math.floor(HIGH_FREQ / frequencyBinSize);

            for (let i = startIndex; i < endIndex; i += 1) {
              const freq = i * frequencyBinSize;
              const magnitude = dataArray[i];
              
              if (freq >= LOW_FREQ && freq <= HIGH_FREQ && !isNaN(magnitude) && isFinite(magnitude) && magnitude > -100) {
                newData.push({
                  freq: Math.round(freq),
                  magnitude: Math.round(magnitude)
                });
              }
            }
            
            const found = newData.sort((a, b) => b.magnitude - a.magnitude)?.[0];
            if (found && found.magnitude > detectedFreq.magnitude) {
              detectedFreq = found;
            }
          };

          const audioInterval = setInterval(processAudioData, 100);

          setTimeout(() => {
            clearInterval(audioInterval);
            cleanupAudio();
            resolve(detectedFreq);
          }, LISTENING_DURATION);

        } catch (err) {
          cleanupAudio();
          reject(err);
        }
      };

      startListening();
    });
  };

  // Main attendance marking logic
  const handleAttendanceProcess = async () => {
    try {
      // Reset any previous errors
      setError(null);

      // Verify location first
      const locationPosition = await getLocationPromise();
      const locationDetails = {
        accuracy: locationPosition.coords.accuracy,
        latitude: locationPosition.coords.latitude,
        longitude: locationPosition.coords.longitude,
        timestamp: locationPosition.timestamp
      };
      setCurrentLocation(locationDetails);

      // Then detect frequency
      const frequencyData = await detectFrequency();
      setDetectedFrequency(frequencyData);

      // Finally mark attendance
      if (!attendanceData?.linkId) {
        throw new Error('No active attendance session');
      }

      setStep('submitting');
      const result:any = await markAttendance(
        attendanceData.linkId, 
        locationDetails.latitude,
        locationDetails.longitude,
        frequencyData.freq
      );
      
      if (result.success) {
        setStep('completed');
        setSuccess(result as any);
      } else {
        setError(result.error as string);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete attendance process');
      setStep('initial');
    }
  };

  // Render logic
  if (error) {
    return (
      <Card className="w-full mx-auto">
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  if(success){
   
    return(
      <div>
        <SuccessComponent message={success.success} isPotentialProxy={success.isPotentialProxy} status={success.status} />
      </div>
    )
  }

  if (!attendanceData) {
    return <div>Loading attendance session...</div>;
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Progress */}
        {(step === 'location' || step === 'frequency' || step === 'submitting') && (
          <div className="space-y-2">
            <Progress 
              value={
                step === 'location' ? locationProgress : 
                step === 'frequency' ? 50 : 
                step === 'submitting' ? 75 : 0
              } 
              className="w-full" 
            />
            <p className="text-sm text-center text-muted-foreground">
              {step === 'location' && locationMessage}
              {step === 'frequency' && 'Detecting presence signal...'}
              {step === 'submitting' && 'Marking attendance...'}
            </p>
          </div>
        )}

        {/* Main Action Button */}
        <Button
          onClick={handleAttendanceProcess}
          className="w-full"
          disabled={step !== 'initial'}
        >
          {step === 'initial' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Attendance
            </>
          ) : step === 'location' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying Location...
            </>
          ) : step === 'frequency' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Detecting Presence...
            </>
          ) : step === 'submitting' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Marking Attendance...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Attendance Marked
            </>
          )}
        </Button>

        {/* Debugging Info (optional) */}
        {currentLocation && (
          <div className="text-xs text-muted-foreground text-center">
            Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)} 
            (Accuracy: {currentLocation.accuracy.toFixed(2)}m)
          </div>
        )}
        {detectedFrequency.freq > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            Signal: {detectedFrequency.freq}Hz (Magnitude: {detectedFrequency.magnitude})
          </div>
        )}
      </CardContent>
    </Card>
  );
}
