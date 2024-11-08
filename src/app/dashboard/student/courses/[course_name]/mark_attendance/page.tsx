// app/courses/[course_name]/mark-attendance/page.tsx
import { Suspense } from 'react';
import { currentProfile } from "@/lib/currentProfile";
import { redirect } from "next/navigation";
import ErrorComponent from "@/components/dashboard/mark_attendence/attendence_error";
import LoadingComponent from "@/components/dashboard/mark_attendence/attendence_loading";
import { db } from '@/lib/db';
import AttendanceMarker from '@/components/dashboard/mark_attendence/attendancemarker';

export const dynamic = 'force-dynamic';

export default async function AttendancePage({ 
  params 
}: { 
  params: { course_name: string } 
}) {
  const user = await currentProfile();

  if (!user?.student) {
    return redirect("/auth/login");
  }

  if (user.role !== 'STUDENT') {
    return <ErrorComponent message="Only students can access this page" />;
  }

  const course = await db.course.findFirst({
    where: { id: params.course_name },
  });

  if (!course) {
    return <ErrorComponent message="Course not found" />;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">{course.name} - Mark Attendance</h1>
      
      <Suspense fallback={<LoadingComponent />}>
        <AttendanceMarker
          courseId={course.id}
          studentId={user.student.id}
        />
      </Suspense>
    </div>
  );
}