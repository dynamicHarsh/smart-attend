'use client';

import { useState, useEffect } from 'react';
import { getGeolocation, GeolocationResult } from '@/lib/geolocation';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, MapPin, AlertCircle } from "lucide-react";

export default function AttendanceForm({ qrData }: { qrData: string }) {
  const [geolocation, setGeolocation] = useState<GeolocationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchGeolocation() {
      const result = await getGeolocation();
      setGeolocation(result);
      setIsLoading(false);

      if (result.coords) {
        router.push(`/dashboard/student/courses/[course_name]/mark_attendance?data=${qrData}&latitude=${result.coords.latitude}&longitude=${result.coords.longitude}`);
      }
    }

    fetchGeolocation();
  }, [qrData, router]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Marking Attendance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-lg text-center text-muted-foreground">Getting your location...</p>
        </CardContent>
      </Card>
    );
  }

  if (geolocation?.error) {
    return (
      <Alert variant="destructive" className="w-full max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to get your location: {geolocation.error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Attendance Marked</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <MapPin className="w-12 h-12 text-primary mb-4" />
        <p className="text-lg text-center text-muted-foreground">
          Your attendance has been recorded successfully.
        </p>
      </CardContent>
    </Card>
  );
}