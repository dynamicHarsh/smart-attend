import CourseCard from "@/components/dashboard/course_card";
import { Button } from "@/components/ui/button";
import { getEnrolledCourses } from "@/lib/actions";
import { signOut } from "@/lib/auth";
import { currentProfile } from "@/lib/currentProfile";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

const StudentPage = async () => {
  const student = await currentProfile();
  const username = student?.username;
  if(student?.role===Role.TEACHER){
    return redirect("/dashboard")
  }

  const enrolledCoursesResponse = username
    ? await getEnrolledCourses(username)
    : { error: "Username not found" };

  const isEnrolledCoursesResponse = (
    response: typeof enrolledCoursesResponse
  ): response is { courses: { id: string; name: string; code: string; session: string; department: string }[] } =>
    'courses' in response && response.courses !== undefined;

 

  return (
    <div className="ml-2">
    

        <h2>Enrolled Courses</h2>
        {isEnrolledCoursesResponse(enrolledCoursesResponse) ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {enrolledCoursesResponse.courses.map((course) => (
             <CourseCard key={course.id} course={course} />
          ))}
        </div>
        ) : (
          <p>{enrolledCoursesResponse.error}</p>
        )}
   
    </div>
  );
};

export default StudentPage;