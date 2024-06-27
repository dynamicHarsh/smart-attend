'use client';
import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { generateQRCode } from '@/lib/actions';

interface Props {
  teacherId: string;
  courseId: string;
}

export default function GenerateQRCodeComponent({ teacherId, courseId }: Props) {
  const [qrData, setQrData] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [domain, setDomain] = useState('');

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
    try {
      const result = await generateQRCode(teacherId, courseId);
      if (result.success) {
        const encodedData = btoa(JSON.stringify({
          teacherId,
          courseId,
          code: result.code,
          expiresAt: result.expiresAt,
          qrCodeId: result.qrCodeId  // Include the QR code ID
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
    }
  };

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold mb-4">Generate QR Code</h1>
      <button
        onClick={handleGenerateQRCode}
        className="px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Generate New QR Code
      </button>
      {qrData && !isExpired && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Generated QR Code:</h2>
          <QRCode value={qrData} size={256} />
          <p>Expires at: {expiresAt?.toLocaleString()}</p>
        </div>
      )}
      {isExpired && (
        <p className="mt-4 text-red-500">QR Code has expired. Please generate a new one.</p>
      )}
    </div>
  );
}