"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Volume2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SAMPLE_RATE = 48000;
const FFT_SIZE = 2048;
const DETECTION_THRESHOLD = -50;
const BIT_DURATION = 0.1;

export default function SoundReceiver() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const [frequencyLow, setFrequencyLow] = useState(2000);
  const [frequencyHigh, setFrequencyHigh] = useState(8000);
  const [receivedData, setReceivedData] = useState({
    binaryMessage: '',
    decodedText: ''
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bitBufferRef = useRef<string>('');
  const lastBitTimeRef = useRef<number>(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  const validateFrequencies = () => {
    if (frequencyLow >= frequencyHigh) {
      setError('Low frequency must be less than high frequency');
      return false;
    }
    if (frequencyLow < 20 || frequencyHigh > 20000) {
      setError('Frequencies must be between 20Hz and 20kHz');
      return false;
    }
    return true;
  };

  const cleanupAudio = () => {
    console.log('Cleaning up audio resources...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Audio track stopped');
      });
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      console.log('AudioContext closed');
    }
    setIsListening(false);
    setStatus('idle');
  };

  const binaryToText = (binary: string) => {
    console.log('Converting binary to text:', binary);
    const bytes = binary.match(/.{1,8}/g) || [];
    const text = bytes.map(byte => {
      const charCode = parseInt(byte, 2);
      console.log(`Converting byte ${byte} to char code ${charCode}`);
      return String.fromCharCode(charCode);
    }).join('');
    console.log('Converted text:', text);
    return text;
  };

  const processAudioData = () => {
    if (!isListening || !analyserRef.current) return;

    frameCountRef.current++;
    if (frameCountRef.current % 60 === 0) {
      console.log('Processing frame:', frameCountRef.current);
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatFrequencyData(dataArray);

    const frequencyBinSize = SAMPLE_RATE / FFT_SIZE;
    const lowFreqBin = Math.floor(frequencyLow / frequencyBinSize);
    const highFreqBin = Math.floor(frequencyHigh / frequencyBinSize);

    const magnitudeLow = dataArray[lowFreqBin];
    const magnitudeHigh = dataArray[highFreqBin];

    if (frameCountRef.current % 60 === 0) {
      console.log('Frequency analysis:', {
        binSize: frequencyBinSize,
        lowFreqBin,
        highFreqBin,
        magnitudeLow,
        magnitudeHigh,
        threshold: DETECTION_THRESHOLD
      });
    }

    const currentTime = audioContextRef.current?.currentTime || 0;
    const timeSinceLastBit = currentTime - lastBitTimeRef.current;

    if (timeSinceLastBit >= BIT_DURATION) {
      if (magnitudeLow > DETECTION_THRESHOLD || magnitudeHigh > DETECTION_THRESHOLD) {
        const bit = magnitudeHigh > magnitudeLow ? '1' : '0';
        console.log('Detected bit:', {
          bit,
          timeSinceLastBit,
          magnitudeLow,
          magnitudeHigh
        });

        bitBufferRef.current += bit;
        lastBitTimeRef.current = currentTime;

        setReceivedData(prev => ({
          ...prev,
          binaryMessage: bitBufferRef.current
        }));

        if (bitBufferRef.current.length >= 8) {
          console.log('Attempting to decode byte:', bitBufferRef.current.slice(0, 8));
          try {
            const textChunk = binaryToText(bitBufferRef.current.slice(0, 8));
            console.log('Successfully decoded chunk:', textChunk);
            
            setReceivedData(prev => {
              const newData = {
                binaryMessage: bitBufferRef.current,
                decodedText: prev.decodedText + textChunk
              };
              console.log('Updated received data:', newData);
              return newData;
            });
            
            bitBufferRef.current = bitBufferRef.current.slice(8);
            console.log('Remaining bit buffer:', bitBufferRef.current);

            if (receivedData.decodedText.length > 0) {
              console.log('Checking for message completion:', receivedData.decodedText);
              if (receivedData.decodedText.includes('\n') || receivedData.decodedText.length >= 32) {
                console.log('Message reception complete');
                setStatus('received');
                setIsListening(false);
                return;
              }
            }
          } catch (err) {
            console.error('Error decoding bits:', err);
          }
        }
      } else if (frameCountRef.current % 60 === 0) {
        console.log('No signal detected above threshold');
      }
    }

    requestAnimationFrame(processAudioData);
  };

  const startListening = async () => {
    if (!validateFrequencies()) return;
    
    console.log('Starting listening process...');
    try {
      setIsListening(true);
      setStatus('initializing');
      setError(null);
      setReceivedData({ binaryMessage: '', decodedText: '' });
      bitBufferRef.current = '';
      frameCountRef.current = 0;

      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: SAMPLE_RATE
        }
      });
      console.log('Microphone access granted');

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('AudioContext created:', audioContextRef.current.state);

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = FFT_SIZE;
      analyserRef.current.smoothingTimeConstant = 0;
      console.log('Analyser node configured:', {
        fftSize: analyserRef.current.fftSize,
        frequencyBinCount: analyserRef.current.frequencyBinCount
      });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 5.0;
      console.log('Audio processing chain created');

      source.connect(gainNode);
      gainNode.connect(analyserRef.current);
      console.log('Audio nodes connected');
      
      streamRef.current = stream;
      setStatus('listening');
      lastBitTimeRef.current = audioContextRef.current.currentTime;
      console.log('Started listening at time:', lastBitTimeRef.current);

      processAudioData();
    } catch (err) {
      console.error('Error in startListening:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setIsListening(false);
      setStatus('error');
    }
  };

  const formatBinary = (binary: string) => {
    return binary.match(/.{1,8}/g)?.join(' ') || binary;
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Sound Receiver</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This receiver listens for frequency-encoded messages. 
            Make sure you're in range of the transmitting device and the environment is relatively quiet.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="lowFreq">Low Frequency (Hz)</Label>
            <Input
              id="lowFreq"
              type="number"
              value={frequencyLow}
              onChange={(e) => setFrequencyLow(Number(e.target.value))}
              min="20"
              max="20000"
              disabled={isListening}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="highFreq">High Frequency (Hz)</Label>
            <Input
              id="highFreq"
              type="number"
              value={frequencyHigh}
              onChange={(e) => setFrequencyHigh(Number(e.target.value))}
              min="20"
              max="20000"
              disabled={isListening}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={isListening ? cleanupAudio : startListening}
          className="w-full"
          variant={isListening ? "destructive" : "default"}
        >
          {status === 'initializing' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing...
            </>
          ) : isListening ? (
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

        {status === 'listening' && (
          <Alert>
            <AlertDescription>
              Listening for signals... Please wait.
            </AlertDescription>
          </Alert>
        )}

        {(receivedData.binaryMessage || receivedData.decodedText) && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-bold mb-2">Binary Message:</h3>
              <p className="font-mono text-sm break-all">{formatBinary(receivedData.binaryMessage)}</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-bold mb-2">Decoded Text:</h3>
              <p className="font-mono">{receivedData.decodedText}</p>
            </div>
          </div>
        )}

        {status === 'received' && (
          <Alert>
            <AlertDescription>
              Message received successfully!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}