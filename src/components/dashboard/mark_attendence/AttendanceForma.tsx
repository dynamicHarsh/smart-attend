'use client';

import { useState, useEffect } from 'react';
import { getGeolocation, GeolocationResult } from '@/lib/geolocation';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Marking Attendance...</h2>
          <p className="text-gray-600">Please wait while we process your request.</p>
        </div>
      </div>
    );
  }

  if (geolocation?.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-semibold mb-2">Error Getting Location</h2>
          <p className="text-gray-600">{geolocation.error}</p>
        </div>
      </div>
    );
  }

  return null; // The component will redirect before reaching this point if successful
}