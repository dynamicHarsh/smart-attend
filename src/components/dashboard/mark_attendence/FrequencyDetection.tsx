"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Volume2 } from "lucide-react";

const WebAudioDetectionComponent: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [audioDetected, setAudioDetected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const TIMEOUT_DURATION = 10000; // 10 seconds timeout for no audio

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudio = () => {
        if (!isListening) return;

        analyserRef.current!.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;

        if (average > 0) { // Adjust this threshold as needed
          setAudioDetected(true);
          setMessage("Audio detected!");
          resetTimeout();
        } else {
          setAudioDetected(false);
          setMessage("Listening for audio...");
        }

        requestAnimationFrame(checkAudio);
      };

      checkAudio();
      setIsListening(true);
      resetTimeout();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMessage("Error accessing microphone. Please ensure you have given permission.");
    }
  };

  const stopListening = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setAudioDetected(false);
    setMessage(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setMessage("No audio detected for 10 seconds. Stopping.");
      stopListening();
    }, TIMEOUT_DURATION);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className="space-y-4">
      <Button
        onClick={isListening ? stopListening : startListening}
        className="w-full"
        variant={isListening ? "destructive" : "default"}
      >
        {isListening ? (
          <>
            <Volume2 className="mr-2 h-4 w-4" />
            Stop Listening
          </>
        ) : (
          <>
            <Volume2 className="mr-2 h-4 w-4" />
            Start Listening for Audio
          </>
        )}
      </Button>
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {audioDetected && (
        <Alert>
          <AlertDescription>Audio detected!</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WebAudioDetectionComponent;