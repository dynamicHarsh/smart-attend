"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Volume2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const SAMPLE_RATE = 48000;
const FFT_SIZE = 2048;

// Set frequency range as global variables
const LOW_FREQ = 17000; // Low end of the frequency range
const HIGH_FREQ = 21000; // High end of the frequency range

type FrequencyDataPoint = {
  freq: number;
  magnitude: number;
};

export default function FrequencyAnalyzer() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frequencyData, setFrequencyData] = useState<FrequencyDataPoint[]>([]);
  const [targetFrequency, setTargetFrequency] = useState<number | null>(null);
  const [targetMagnitude, setTargetMagnitude] = useState<number | null>(null);
  const [matchFound, setMatchFound] = useState<boolean | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

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

    for (let i = 0; i < bufferLength; i += 1) {
      const freq = i * frequencyBinSize;
      const magnitude = dataArray[i];
      
      // Filter frequencies within the specified range
      if (freq >= LOW_FREQ && freq <= HIGH_FREQ && !isNaN(magnitude) && isFinite(magnitude)) {
        newData.push({
          freq: Math.round(freq),
          magnitude: Math.round(magnitude)
        });
      }
    }
    setFrequencyData(newData);
    animationFrameRef.current = requestAnimationFrame(processAudioData);
  };

  const startListening = async () => {
    try {
      setError(null);
      setIsListening(true);

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
      processAudioData();

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

  const handleSearch = () => {
    if (targetFrequency == null || targetMagnitude == null) {
      setMatchFound(null);
      return;
    }

    const found = frequencyData.some(
      (data) => (data.freq >= targetFrequency-50 ||data.freq<=(targetFrequency+50)) && data.magnitude > targetMagnitude
    );
    setMatchFound(found);
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Frequency Analyzer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This analyzer displays the frequency spectrum of incoming audio in real-time.
            The X-axis shows frequency in Hz, and the Y-axis shows the magnitude in dB.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
              Start Listening
            </>
          )}
        </Button>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">Strongest Frequencies:</h3>
          <div className="grid grid-cols-2 gap-4">
            {frequencyData
              .sort((a, b) => b.magnitude - a.magnitude)
              .slice(0, 15)
              .map((data, index) => (
                <div key={index} className="flex justify-between">
                  <span>{data.freq} Hz</span>
                  <span>{data.magnitude} dB</span>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-bold mb-2">Search for Specific Frequency and Magnitude</h3>
          <input
            type="number"
            placeholder="Frequency (Hz)"
            value={targetFrequency ?? ''}
            onChange={(e) => setTargetFrequency(Number(e.target.value))}
            className="p-2 border rounded mb-2 w-full"
          />
          <input
            type="number"
            placeholder="Magnitude (dB)"
            value={targetMagnitude ?? ''}
            onChange={(e) => setTargetMagnitude(Number(e.target.value))}
            className="p-2 border rounded mb-2 w-full"
          />
          <Button onClick={handleSearch} className="w-full mt-2">Search</Button>

          {matchFound != null && (
            <div className="mt-2">
              {matchFound ? (
                <Alert>
                  <AlertDescription>Match found!</AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>No match found.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
