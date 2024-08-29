// app/dashboard/student/courses/[course_name]/mark_attendance/page.tsx

import { Suspense } from 'react';
import { currentProfile } from "@/lib/currentProfile";
import { redirect } from "next/navigation";
import ErrorComponent from "@/components/dashboard/mark_attendence/attendence_error";
import LoadingComponent from "@/components/dashboard/mark_attendence/attendence_loading";
import { markAttendance } from "@/lib/actions";
import SuccessComponent from "@/components/dashboard/mark_attendence/attendence_success";
import AttendanceForm from '@/components/dashboard/mark_attendence/AttendanceForma';

export const dynamic = 'force-dynamic';

async function AttendanceMarker({ searchParams }: { searchParams: { data: string; latitude: string; longitude: string; } }) {
  const { data, latitude, longitude } = searchParams;

  if (!data || !latitude || !longitude) {
    return <ErrorComponent message="Invalid QR Code or location data" />;
  }

  const result = await markAttendance(data, parseFloat(latitude), parseFloat(longitude));

  if (result.success) {
    return <SuccessComponent 
      message={result.success} 
      status={result.status} 
      isPotentialProxy={result.isPotentialProxy} 
    />;
  } else if (result.error) {
    return <ErrorComponent message={result.error} />;
  }

  return <ErrorComponent message="An unexpected error occurred" />;
}

export default async function MarkAttendance({
  searchParams
}: {
  searchParams: { data?: string; latitude?: string; longitude?: string; }
}) {
  const user = await currentProfile();

  if (!user) {
    return redirect("/auth/login");
  }

  if (!searchParams.data) {
    return <ErrorComponent message="Invalid QR Code" />;
  }

  if (!searchParams.latitude || !searchParams.longitude) {
    return (
      <AttendanceForm qrData={searchParams.data} />
    );
  }

  return (
    <Suspense fallback={<LoadingComponent />}>
      <AttendanceMarker searchParams={searchParams as { data: string; latitude: string; longitude: string; }} />
    </Suspense>
  );
}