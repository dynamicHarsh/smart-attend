import ErrorComponent from "@/components/dashboard/mark_attendence/attendence_error";
import LoadingComponent from "@/components/dashboard/mark_attendence/attendence_loading";
import SuccessComponent from "@/components/dashboard/mark_attendence/attendence_success";
import { markAttendance } from "@/lib/actions";
import { currentProfile } from "@/lib/currentProfile";
import { redirect } from "next/navigation";
import { Suspense } from 'react';

async function AttendanceMarker({ data }: { data: string }) {
  const result = await markAttendance(data);

  if (result.success) {
    return <SuccessComponent message={result.success} />;
  } else if (result.error) {
    return <ErrorComponent message={result.error} />;
  }

  // This shouldn't happen, but just in case
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

  return (
    <Suspense fallback={<LoadingComponent />}>
      <AttendanceMarker data={searchParams.data} />
    </Suspense>
  );
}