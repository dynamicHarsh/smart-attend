"use client"
import React, { useState, useEffect, useRef } from 'react';
import { generateAttendanceLink } from '@/lib/actions';
import useDiagnosticGeolocation from '@/hooks/useGeolocation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, Link, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  teacherId: string;
  courseId: string;
}

export default function GenerateLinkComponent({ teacherId, courseId }: Props) {
  const [linkData, setLinkData] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [domain, setDomain] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { coords, error, accuracy, timestamp, isHighAccuracy, provider, attempts, status, getLocation } = useDiagnosticGeolocation(150, 30000);
  const [activeTab, setActiveTab] = useState("geolocation");
  const [isEmittingFrequency, setIsEmittingFrequency] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    setDomain(window.location.origin);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expiresAt) {
      const checkExpiration = () => {
        if (new Date() > expiresAt) {
          setIsExpired(true);
          clearInterval(timer);
        }
      };
      timer = setInterval(checkExpiration, 1000);
      checkExpiration();
    }
    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleGenerateLink = async () => {
    if (!coords) {
      console.error('Location not available');
      return;
    }

    setIsGeneratingLink(true);

    try {
      const result = await generateAttendanceLink(teacherId, courseId, coords.latitude, coords.longitude);
      if (result.success) {
        const url = `${domain}/dashboard/student/courses/${courseId}/mark_attendance?linkId=${result.linkId}`;
        setLinkData(url);
        setExpiresAt(new Date(result.expiresAt));
        setIsExpired(false);
      } else {
        console.error('Error generating attendance link:', result.error);
      }
    } catch (error) {
      console.error('Error generating attendance link:', error);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const generateUniqueFrequencyPattern = () => {
    // This function generates a unique pattern of frequencies
    // You may want to implement a more sophisticated algorithm here
    const baseFrequency = 18000 + Math.random() * 2000; // Between 18kHz and 20kHz
    return [
      baseFrequency,
      baseFrequency + 100,
      baseFrequency + 200,
      baseFrequency + 300
    ];
  };

  const handleFrequencyEmission = () => {
    if (isEmittingFrequency) {
      // Stop emitting frequency
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setIsEmittingFrequency(false);
    } else {
      // Start emitting frequency
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a gain node to control volume
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.setValueAtTime(0.1, audioContextRef.current.currentTime); // Adjust volume here
      gainNodeRef.current.connect(audioContextRef.current.destination);

      const frequencies = generateUniqueFrequencyPattern();
      
      // Function to play each frequency in the pattern
      const playPattern = (index: number) => {
        if (index >= frequencies.length) index = 0;
        
        oscillatorRef.current = audioContextRef.current!.createOscillator();
        oscillatorRef.current.type = 'sine';
        oscillatorRef.current.frequency.setValueAtTime(frequencies[index], audioContextRef.current!.currentTime);
        oscillatorRef.current.connect(gainNodeRef.current!);
        oscillatorRef.current.start();
        oscillatorRef.current.stop(audioContextRef.current!.currentTime + 0.1); // Play each frequency for 0.1 seconds
        
        oscillatorRef.current.onended = () => {
          setTimeout(() => playPattern(index + 1), 100); // 100ms gap between frequencies
        };
      };

      playPattern(0);
      setIsEmittingFrequency(true);
    }
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Attendance System</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="geolocation">Geolocation</TabsTrigger>
            <TabsTrigger value="frequency">Frequency</TabsTrigger>
          </TabsList>
          <TabsContent value="geolocation">
            <Button
              onClick={getLocation}
              className="w-full mb-4"
              variant="outline"
              disabled={isGeneratingLink || status === 'watching'}
            >
              {status === 'watching' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Get Accurate Location (Attempt: {attempts})
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {coords && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-100 p-4 rounded-lg space-y-2 mb-4"
              >
                <p><strong>Location:</strong> {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</p>
                <p><strong>Accuracy:</strong> {accuracy?.toFixed(2)} meters</p>
                <p><strong>Timestamp:</strong> {new Date(timestamp || 0).toLocaleString()}</p>
                <p><strong>High Accuracy:</strong> {isHighAccuracy ? 'Yes' : 'No'}</p>
                <p><strong>Provider:</strong> {provider}</p>
                <p><strong>Status:</strong> {status}</p>
              </motion.div>
            )}

            <Button
              onClick={handleGenerateLink}
              className="w-full"
              disabled={isGeneratingLink || !coords || status === 'watching'}
            >
              {isGeneratingLink ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Generate Attendance Link
                </>
              )}
            </Button>

            {linkData && !isExpired && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="border p-4 rounded-lg text-center mt-4"
              >
                <h3 className="font-bold mb-2">Generated Attendance Link:</h3>
                <Input value={linkData} readOnly className="mb-2" />
                <Button
                  onClick={() => navigator.clipboard.writeText(linkData)}
                  variant="outline"
                  className="w-full"
                >
                  Copy Link
                </Button>
                <p className="mt-2">Expires at: {expiresAt?.toLocaleString()}</p>
              </motion.div>
            )}

            {isExpired && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>Attendance link has expired. Please generate a new one.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="frequency">
            <Button
              onClick={handleFrequencyEmission}
              className="w-full mb-4"
              variant={isEmittingFrequency ? "destructive" : "default"}
            >
              {isEmittingFrequency ? (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Stop Emitting Frequency
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Start Emitting Frequency
                </>
              )}
            </Button>
            <Alert>
              <AlertDescription>
                This feature will emit a unique pattern of high-frequency sounds from your device. 
                The frequencies are designed to be detectable up to approximately 10 meters away. 
                Please note that the effectiveness may vary depending on environmental factors and device capabilities.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}