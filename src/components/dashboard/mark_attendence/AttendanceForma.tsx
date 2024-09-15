import React, { useState, useEffect } from 'react';
import { markAttendance } from '@/lib/actions';
import useDiagnosticGeolocation from '@/hooks/useGeolocation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, CheckCircle } from "lucide-react";

interface Props {
  linkId: string;
  courseId: string;
}

export default function StudentMarkAttendanceComponent({ linkId, courseId }: Props) {
  const [isMarking, setIsMarking] = useState(false);
  const [result, setResult] = useState<{ success?: string; error?: string; status?: string; isPotentialProxy?: boolean } | null>(null);
  const { coords, error, accuracy, timestamp, isHighAccuracy, provider, attempts, status, getLocation } = useDiagnosticGeolocation(150, 30000, 2);

  const handleMarkAttendance = async () => {
    if (!coords) {
      console.error('Location not available');
      return;
    }

    setIsMarking(true);

    try {
      const attendanceResult = await markAttendance(linkId, coords.latitude, coords.longitude);
      setResult(attendanceResult);
    } catch (error) {
      console.error('Error marking attendance:', error);
      setResult({ error: 'An unexpected error occurred' });
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={getLocation}
          className="w-full"
          variant="outline"
          disabled={isMarking || status === 'watching'}
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
          <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <p><strong>Location:</strong> {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</p>
            <p><strong>Accuracy:</strong> {accuracy?.toFixed(2)} meters</p>
            <p><strong>Timestamp:</strong> {new Date(timestamp || 0).toLocaleString()}</p>
            <p><strong>High Accuracy:</strong> {isHighAccuracy ? 'Yes' : 'No'}</p>
            <p><strong>Provider:</strong> {provider}</p>
            <p><strong>Status:</strong> {status}</p>
          </div>
        )}

        <Button
          onClick={handleMarkAttendance}
          className="w-full"
          disabled={!coords || isMarking || status === 'watching'}
        >
          {isMarking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Marking Attendance...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Attendance
            </>
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <AlertDescription>
              {result.success || result.error}
              {result.status && <p>Status: {result.status}</p>}
              {result.isPotentialProxy && <p>Note: Potential proxy attendance detected</p>}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}