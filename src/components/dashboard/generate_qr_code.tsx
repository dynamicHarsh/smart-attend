'use client'

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { generateQRCode } from '@/lib/actions';
import useDiagnosticGeolocation from '@/hooks/useGeolocation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, RefreshCw } from "lucide-react";

interface Props {
  teacherId: string;
  courseId: string;
}

export default function GenerateQRCodeComponent({ teacherId, courseId }: Props) {
  const [qrData, setQrData] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [domain, setDomain] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const { coords, error, accuracy, timestamp, isHighAccuracy, provider, attempts, status, getLocation } = useDiagnosticGeolocation(150, 30000, 2);

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

  const handleGenerateQRCode = async () => {
    if (!coords) {
      console.error('Location not available');
      return;
    }

    setIsGeneratingQR(true);

    try {
      const result = await generateQRCode(teacherId, courseId, coords.latitude, coords.longitude);
      if (result.success) {
        const encodedData = btoa(JSON.stringify({
          teacherId,
          courseId,
          code: result.code,
          expiresAt: result.expiresAt,
          qrCodeId: result.qrCodeId,
          latitude: coords.latitude,
          longitude: coords.longitude
        }));
        const url = `${domain}/dashboard/student/courses/${courseId}/mark_attendance?data=${encodedData}`;
        setQrData(url);
        setExpiresAt(new Date(result.expiresAt));
        setIsExpired(false);
      } else {
        console.error('Error generating QR code:', result.error);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">QR Code Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={getLocation}
          className="w-full"
          variant="outline"
          disabled={isGeneratingQR || status === 'watching'}
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
            className="bg-gray-100 p-4 rounded-lg space-y-2"
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
          onClick={handleGenerateQRCode}
          className="w-full"
          disabled={!coords || isGeneratingQR || status === 'watching'}
        >
          {isGeneratingQR ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate New QR Code
            </>
          )}
        </Button>

        {status === 'timedOut' && (
          <Alert>
            <AlertDescription>
              Location accuracy is low. The QR code will be generated with the best available location, 
              but it may not be as accurate as desired. Consider trying again in a different location or environment.
            </AlertDescription>
          </Alert>
        )}

        {qrData && !isExpired && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="border p-4 rounded-lg text-center"
          >
            <h3 className="font-bold mb-2">Generated QR Code:</h3>
            <div className="flex justify-center">
              <QRCode value={qrData} size={256} />
            </div>
            <p className="mt-2">Expires at: {expiresAt?.toLocaleString()}</p>
          </motion.div>
        )}

        {isExpired && (
          <Alert variant="destructive">
            <AlertDescription>QR Code has expired. Please generate a new one.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}