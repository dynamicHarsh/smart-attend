// app/dashboard/student/courses/[courseId]/mark_attendance/page.tsx

import { getAccuratePosition } from '@/lib/geolocation';
import ErrorComponent from "@/components/dashboard/mark_attendence/attendence_error";
import LoadingComponent from "@/components/dashboard/mark_attendence/attendence_loading";
import SuccessComponent from "@/components/dashboard/mark_attendence/attendence_success";
import { markAttendance } from "@/lib/actions";
import { currentProfile } from "@/lib/currentProfile";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

async function AttendanceMarker({ data, latitude, longitude, accuracy }: { 
  data: string; 
  latitude: number; 
  longitude: number; 
  accuracy: number;
}) {
  const result = await markAttendance(data, latitude, longitude, accuracy);

  if (result.success) {
    return (
      <SuccessComponent 
        message={result.success}
        status={result.status}
        isPotentialProxy={result.isPotentialProxy}
      />
    );
  } else if (result.error) {
    return <ErrorComponent message={result.error} />;
  }

  return <ErrorComponent message="An unexpected error occurred" />;
}

export default async function MarkAttendance({
  searchParams
}: {
  searchParams: { data?: string }
}) {
  const user = await currentProfile();
  
  if (!user) {
    return redirect("/auth/login");
  }

  if (!searchParams.data) {
    return <ErrorComponent message="Invalid QR Code" />;
  }

  try {
    const { latitude, longitude, accuracy } = await getAccuratePosition();
    return <AttendanceMarker data={searchParams.data} latitude={latitude} longitude={longitude} accuracy={accuracy} />;
  } catch (error) {
    return <ErrorComponent message="Failed to get accurate location. Please ensure location services are enabled and try again." />;
  }
}