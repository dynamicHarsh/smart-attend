// components/dashboard/mark_attendence/AttendanceForm.tsx

'use client';

import { useState, useEffect } from 'react';
import { getGeolocation, GeolocationResult } from '@/lib/geolocation';
import { useRouter } from 'next/navigation';

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
    return <p>Getting your location...</p>;
  }

  if (geolocation?.error) {
    return <p>Error getting location: {geolocation.error}</p>;
  }

  return null; // The component will redirect before reaching this point if successful
}