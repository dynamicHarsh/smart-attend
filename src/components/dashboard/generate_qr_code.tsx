import React, { useState, useEffect } from 'react';
import { generateAttendanceLink } from '@/lib/actions';
import useDiagnosticGeolocation from '@/hooks/useGeolocation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, Link } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Generate Attendance Link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={getLocation}
          className="w-full"
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
          onClick={handleGenerateLink}
          className="w-full"
          disabled={!coords || isGeneratingLink || status === 'watching'}
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

        {status === 'timedOut' && (
          <Alert>
            <AlertDescription>
              Location accuracy is low. The link will be generated with the best available location, 
              but it may not be as accurate as desired. Consider trying again in a different location or environment.
            </AlertDescription>
          </Alert>
        )}

        {linkData && !isExpired && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="border p-4 rounded-lg text-center"
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
          <Alert variant="destructive">
            <AlertDescription>Attendance link has expired. Please generate a new one.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}