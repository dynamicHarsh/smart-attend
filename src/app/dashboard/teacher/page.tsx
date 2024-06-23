export const dynamic = 'force-dynamic'

import CourseCard from "@/components/dashboard/course_card";
import { Button } from "@/components/ui/button";
import { getCoursesForTeacher } from "@/lib/actions";
import { signOut } from "@/lib/auth";
import { currentProfile } from "@/lib/currentProfile";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

const TeacherPage = async () => {
  const teacher = await currentProfile();

  if(teacher?.role===Role.STUDENT){
    return redirect("/dashboard")
  }
  const coursesResponse =teacher?.username
  ? await getCoursesForTeacher(teacher?.username)
  : { error: "Username not found" };

  const isCourseResponse = (
    response: typeof coursesResponse
  ): response is { courses: { id: string; name: string; code: string; session: string; department: string }[] } =>
    'courses' in response && response.courses !== undefined;

 

  return (
    <div className="ml-2">
      

        <h6 className="mb-8 text-sm">Assigned Courses</h6>
        {isCourseResponse(coursesResponse) && (
         <div className=" w-full grid  grid-cols-1 gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ">
            {coursesResponse.courses.map((course) => (
               <CourseCard key={course.id} course={course} />
              
            ))}
          </div>
        )}
    </div>
  );
};

export default TeacherPage;