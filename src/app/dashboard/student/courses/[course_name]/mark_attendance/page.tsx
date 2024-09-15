// app/dashboard/student/courses/[course_name]/page.tsx

import { Suspense } from 'react';
import { currentProfile } from "@/lib/currentProfile";
import { redirect } from "next/navigation";
import ErrorComponent from "@/components/dashboard/mark_attendence/attendence_error";
import LoadingComponent from "@/components/dashboard/mark_attendence/attendence_loading";
import SuccessComponent from "@/components/dashboard/mark_attendence/attendence_success";
import StudentMarkAttendanceComponent from '@/components/dashboard/mark_attendence/AttendanceForma';
import { getAttendanceButton } from "@/lib/actions";
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function AttendanceButton({ courseId, studentId }: { courseId: string, studentId: string }) {
  const result = await getAttendanceButton(studentId, courseId);

  if (result.error) {
    return <ErrorComponent message={result.error} />;
  }

  if (!result.show) {
    return null;
  }

  return <StudentMarkAttendanceComponent linkId={result.linkId!} courseId={courseId} />;
}

export default async function CoursePage({ params }: { params: { course_name: string } }) {
  const user = await currentProfile();

  if (!user) {
    return redirect("/auth/login");
  }

  if (user.role !== 'STUDENT') {
    return <ErrorComponent message="Only students can access this page" />;
  }

  const course = await db.course.findFirst({
    where: { name: params.course_name },
  });

  if (!course) {
    return <ErrorComponent message="Course not found" />;
  }

  return (
    <div>
      <h1>{course.name}</h1>
      {/* Other course information */}
      
      <Suspense fallback={<LoadingComponent />}>
        <AttendanceButton courseId={course.id} studentId={user.id} />
      </Suspense>
    </div>
  );
}