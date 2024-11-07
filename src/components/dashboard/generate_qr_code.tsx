'use client'
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Volume2, Loader2, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";

const CARRIER_FREQUENCY = 100;
const DURATION = 0.1;
const SAMPLE_RATE = 48000;

export default function FrequencyTransmissionComponent() {
  const [message, setMessage] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [error, setError] = useState('');
  const [repetitions, setRepetitions] = useState(3);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [frequencyLow, setFrequencyLow] = useState(200);
  const [frequencyHigh, setFrequencyHigh] = useState(2000);
  const [progress, setProgress] = useState({ 
    currentRepetition: 0,
    estimatedTimeLeft: 0 
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isTransmittingRef = useRef(false);

  const initializeAudio = async () => {
    console.log('Initializing audio...');
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = 0.5;
        gainNodeRef.current.connect(audioContextRef.current.destination);
        console.log('AudioContext created successfully');
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('AudioContext resumed');
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasAudioPermission(true);
        console.log('Audio permission granted');
      } catch (err) {
        console.error('Failed to get audio permission:', err);
        setError('Please grant audio permissions to use this feature.');
        return false;
      }

      setError('');
      return true;
    } catch (err) {
      console.error('Error during audio initialization:', err);
      setError('Failed to initialize audio system. Please try again.');
      return false;
    }
  };

  const validateFrequencies = () => {
    if (frequencyLow <= 0 || frequencyHigh <= 0) {
      setError('Frequencies must be positive numbers');
      return false;
    }
    if (frequencyLow >= frequencyHigh) {
      setError('High frequency must be greater than low frequency');
      return false;
    }
    if (frequencyHigh > SAMPLE_RATE / 2) {
      setError(`High frequency must be less than ${SAMPLE_RATE / 2}Hz`);
      return false;
    }
    return true;
  };

  const playTestTone = async () => {
    console.log('Starting test tone...');
    try {
      if (!validateFrequencies()) return;
      
      setIsTestingAudio(true);
      const initialized = await initializeAudio();
      if (!initialized) return;

      if (audioContextRef.current && gainNodeRef.current) {
        // Play both frequencies in sequence
        const oscillator = audioContextRef.current.createOscillator();
        oscillator.type = 'sine';
        
        // Play low frequency
        oscillator.frequency.setValueAtTime(frequencyLow, audioContextRef.current.currentTime);
        oscillator.connect(gainNodeRef.current);
        oscillator.start();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Play high frequency
        oscillator.frequency.setValueAtTime(frequencyHigh, audioContextRef.current.currentTime + 0.1);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        oscillator.stop();
        oscillator.disconnect();
        console.log('Test tones played successfully');
      }
    } catch (err) {
      console.error('Error playing test tone:', err);
      setError('Error playing test tone. Please try again.');
    } finally {
      setIsTestingAudio(false);
    }
  };

  const playFrequency = async (frequency: number, duration: number) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    
    return new Promise<void>((resolve, reject) => {
      try {
        const oscillator = audioContextRef.current!.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContextRef.current!.currentTime);
        oscillator.connect(gainNodeRef.current!);
        
        oscillator.onended = () => {
          oscillator.disconnect();
          resolve();
        };
        
        oscillator.start();
        oscillator.stop(audioContextRef.current!.currentTime + duration);
      } catch (err) {
        reject(err);
      }
    });
  };

  const stringToBinary = (str: string) => {
    const binary = str.split('').map(char => 
      char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
    console.log('Binary message:', binary);
    return binary;
  };

  const transmitMessage = async () => {
    if (!message) {
      setError('Please enter a message first');
      return;
    }

    if (!validateFrequencies()) return;

    try {
      const initialized = await initializeAudio();
      if (!initialized) return;

      setError('');
      setIsTransmitting(true);
      isTransmittingRef.current = true;
      
      const binaryMessage = stringToBinary(message);
      console.log('Starting transmission of binary message:', binaryMessage);
      
      for (let rep = 0; rep < repetitions && isTransmittingRef.current; rep++) {
        console.log(`Starting repetition ${rep + 1}`);
        
        setProgress({
          currentRepetition: rep + 1,
          estimatedTimeLeft: (repetitions - rep) * (binaryMessage.length * DURATION)
        });

        // Play start marker
        await playFrequency(1500, 0.2);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Transmit bits
        for (let i = 0; i < binaryMessage.length && isTransmittingRef.current; i++) {
          const bit = binaryMessage[i];
          const frequency = bit === '1' ? frequencyHigh : frequencyLow;
          console.log(`Transmitting bit ${i}: ${bit} at ${frequency}Hz`);
          await playFrequency(frequency, DURATION);
        }

        if (rep < repetitions - 1 && isTransmittingRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error during transmission:', error);
      setError('Error during transmission. Please try again.');
    } finally {
      isTransmittingRef.current = false;
      setIsTransmitting(false);
      setProgress({ currentRepetition: 0, estimatedTimeLeft: 0 });
    }
  };

  const stopTransmission = useCallback(() => {
    console.log('Stopping transmission...');
    isTransmittingRef.current = false;
    setIsTransmitting(false);
    if (audioContextRef.current) {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
        console.log('AudioContext closed');
      });
    }
    setProgress({ currentRepetition: 0, estimatedTimeLeft: 0 });
  }, []);

  React.useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Sound Frequency Transmission
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              This feature transmits your message using sound waves. 
              Make sure your speakers are on and at a comfortable volume.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Low Frequency (Hz)</label>
              <Input
                type="number"
                min="1"
                max={SAMPLE_RATE / 2}
                value={frequencyLow}
                onChange={(e) => setFrequencyLow(Number(e.target.value))}
                disabled={isTransmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-500">High Frequency (Hz)</label>
              <Input
                type="number"
                min="1"
                max={SAMPLE_RATE / 2}
                value={frequencyHigh}
                onChange={(e) => setFrequencyHigh(Number(e.target.value))}
                disabled={isTransmitting}
              />
            </div>
          </div>

          <Button 
            onClick={playTestTone} 
            variant="outline" 
            className="w-full"
            disabled={isTestingAudio || isTransmitting}
          >
            {isTestingAudio ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Playing Test Tones...
              </>
            ) : (
              <>
                <Radio className="mr-2 h-4 w-4" />
                Play Test Tones
              </>
            )}
          </Button>

          <div className="space-y-2">
            <Input
              placeholder="Enter your message to transmit"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isTransmitting}
              className="mb-2"
            />
            
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="1"
                max="10"
                value={repetitions}
                onChange={(e) => setRepetitions(Number(e.target.value))}
                disabled={isTransmitting}
                className="w-24"
              />
              <span className="text-sm text-gray-500">
                Repetitions (1-10)
              </span>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <Button
            onClick={isTransmitting ? stopTransmission : transmitMessage}
            className="w-full"
            variant={isTransmitting ? "destructive" : "default"}
          >
            {isTransmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stop Transmission ({progress.currentRepetition}/{repetitions})
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-4 w-4" />
                Start Transmission
              </>
            )}
          </Button>

          {isTransmitting && progress.currentRepetition > 0 && (
            <div className="text-sm text-gray-500 text-center">
              Transmitting repetition {progress.currentRepetition} of {repetitions}
              <br />
              Estimated time remaining: {progress.estimatedTimeLeft.toFixed(1)}s
            </div>
          )}

          {message && !isTransmitting && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p><strong>Message ready to transmit:</strong></p>
              <p className="font-mono break-all">{message}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}