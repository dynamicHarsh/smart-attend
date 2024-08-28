'use client'
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { generateQRCode } from '@/lib/actions';
import useDiagnosticGeolocation from '@/hooks/useGeolocation';

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
  const { coords, error, accuracy, timestamp, isHighAccuracy, provider, attempts, getLocation } = useDiagnosticGeolocation();

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
    <div className="space-y-4">
      <button
        onClick={getLocation}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={isGeneratingQR}
      >
        Get Accurate Location (Attempt: {attempts + 1})
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {coords && (
        <div>
          <p>Location: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</p>
          <p>Accuracy: {accuracy?.toFixed(2)} meters</p>
          <p>Timestamp: {new Date(timestamp || 0).toLocaleString()}</p>
          <p>High Accuracy: {isHighAccuracy ? 'Yes' : 'No'}</p>
          <p>Provider: {provider}</p>
          <p>Attempts: {attempts}</p>
        </div>
      )}
      <button
        onClick={handleGenerateQRCode}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        disabled={!coords || isGeneratingQR || (accuracy ? accuracy > 100 : false)}
      >
        {isGeneratingQR ? 'Generating...' : 'Generate New QR Code'}
      </button>
      {accuracy && accuracy > 100 && (
        <p className="text-yellow-500">Location accuracy is low. Consider retrying for better accuracy.</p>
      )}
      {qrData && !isExpired && (
        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">Generated QR Code:</h3>
          <QRCode value={qrData} size={256} />
          <p className="mt-2">Expires at: {expiresAt?.toLocaleString()}</p>
        </div>
      )}
      {isExpired && (
        <p className="text-red-500">QR Code has expired. Please generate a new one.</p>
      )}
    </div>
  );
}