"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, CheckCircle, Volume2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getAttendanceButton, markAttendance } from '@/lib/actions';

// Constants for audio processing
const SAMPLE_RATE = 48000;
const FFT_SIZE = 32768;
const LOW_FREQ = 18999;  // Low end of the frequency range
const HIGH_FREQ = 19401; // High end of the frequency range
const LISTENING_DURATION = 5000; // 5 seconds
const MAX_LOCATION_TIME = 12000; // 15 seconds
const DESIRED_ACCURACY = 20; // 20 meters
type FrequencyDataPoint = {
  freq: number;
  magnitude: number;
};

export default function AttendanceMarker({ 
  courseId,
  studentId
}: {
  courseId: string,
  studentId: string
}) {
  // States for the entire flow
  const [step, setStep] = useState('initial'); // initial, location, frequency, submitting
  const [error, setError] = useState<string | null>(null);
  const [frequencyDetected, setFrequencyDetected] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [detectedFrequency, setDetectedFrequency] = useState<FrequencyDataPoint>({freq:0,magnitude:-1000});
  const [isListening, setIsListening] = useState(false);
  const [frequencyData, setFrequencyData] = useState<FrequencyDataPoint[]>([]);
  const [targetFrequency, setTargetFrequency] = useState<number | null>(null);
  const [targetMagnitude, setTargetMagnitude] = useState<number | null>(null);
  const [matchFound, setMatchFound] = useState<boolean | null>(null);

  // Location states
  const [locationError, setLocationError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
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
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number>();

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
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (locationTimeoutRef.current !== null) {
        clearTimeout(locationTimeoutRef.current);
      }
      cleanupAudio();
    };
  }, [studentId, courseId]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
  };

  
  const processAudioData = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatFrequencyData(dataArray);

    const frequencyBinSize = SAMPLE_RATE / FFT_SIZE;
  
    const newData: FrequencyDataPoint[] = [];
    const startIndex = Math.floor(LOW_FREQ / frequencyBinSize);
    const endIndex = Math.floor(HIGH_FREQ / frequencyBinSize);
    console.log(bufferLength);

    for (let i = startIndex; i < endIndex; i += 1) {
    
      const freq = i * frequencyBinSize;
      const magnitude = dataArray[i];
      
      // Filter frequencies within the specified range
      if (freq >= LOW_FREQ && freq <= HIGH_FREQ && !isNaN(magnitude) && isFinite(magnitude) && magnitude>-100) {
        newData.push({
          freq: Math.round(freq),
          magnitude: Math.round(magnitude)
        });
      }
    }
    
    
    const found=newData.sort((a, b) => b.magnitude - a.magnitude)?.[0]
    if(found){
      setDetectedFrequency((prev)=>prev?.magnitude>found.magnitude?prev:found);
     
     
    }
    
    // setDetectedFrequency(found.freq);
    
    animationFrameRef.current = requestAnimationFrame(processAudioData);
  };

  
  const startListening = async () => {
    try {
      setError(null);
      setIsListening(true);

      setTimeout(()=>{
        stopListening();
        setFrequencyDetected(true);
        
      },LISTENING_DURATION)


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
       if(stream){
      processAudioData();
       }

    } catch (err) {
      console.error('Error in startListening:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    cleanupAudio();
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

  const getLocationPromise = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      let bestLocation: GeolocationPosition | null = null;
      setIsGettingLocation(true);
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
            cleanupLocation();
            setLocationVerified(true);
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

      locationTimeoutRef.current = setTimeout(() => {
        cleanupLocation();
        if (bestLocation) {
          setLocationVerified(true);
          resolve(bestLocation);
        } else {
          reject(new Error('Could not get accurate location within timeout'));
        }
      }, MAX_LOCATION_TIME);

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

  const handleVerifyLocation = async () => {
    try {
      const position = await getLocationPromise();
      setCurrentLocation({
        accuracy: position.coords.accuracy,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp
      });
      setStep('location');
    } catch (err: any) {
      setLocationError(err.message);
    }
  };

  const handleMarkAttendance = async () => {
    if (!locationVerified || !frequencyDetected || !attendanceData?.linkId || !currentLocation || !detectedFrequency) {
      setError('Please complete both location and frequency verification');
      return;
    }

    try {
      setStep('submitting');
      const result = await markAttendance(
        attendanceData.linkId, 
        currentLocation.latitude,
        currentLocation.longitude,
        detectedFrequency.freq
      );
      
      if (result.success) {
        setStep('completed');
      } else {
        setError(result.error as string);
      }
    } catch (err: any) {
      setError('Failed to mark attendance: ' + err.message);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
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
        {/* Location Verification Section */}
        <div className="space-y-2">
          <h3 className="font-semibold">Step 1: Verify Location</h3>
          <Button
            onClick={handleVerifyLocation}
            className="w-full"
            variant="outline"
            disabled={locationVerified || isGettingLocation}
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Verify Location
              </>
            )}
          </Button>

          {isGettingLocation && (
            <div className="space-y-2">
              <Progress value={locationProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">{locationMessage}</p>
              {currentLocation && (
                <p className="text-xs text-center text-muted-foreground">
                  Current accuracy: {Math.round(currentLocation.accuracy)}m
                </p>
              )}
            </div>
          )}

          {locationError && (
            <Alert variant="destructive">
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}

          {locationVerified && (
            <Alert>
              <AlertDescription>Location verified successfully!</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Frequency Detection Section */}
        {locationVerified && (
          <div className="space-y-2">
            <h3 className="font-semibold">Step 2: Verify Presence</h3>
            <Button
              onClick={startListening}
              className="w-full"
              variant="outline"
              disabled={isListening || frequencyDetected}
            >
              {isListening ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Listening for Signal...
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Start Frequency Detection
                </>
              )}
            </Button>

            
              <Alert>
                <AlertDescription>
                  Signal detected successfully! (Frequency: {detectedFrequency?.freq}Hz) (Magnitude:{detectedFrequency.magnitude})
                </AlertDescription>
              </Alert>
            
          </div>
        )}

        {/* Submit Attendance Button */}
        <Button
          onClick={handleMarkAttendance}
          className="w-full"
          disabled={!locationVerified || !frequencyDetected || step === 'completed'}
        >
          {step === 'submitting' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Marking Attendance...
            </>
          ) : step === 'completed' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Attendance Marked Successfully
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Attendance
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}