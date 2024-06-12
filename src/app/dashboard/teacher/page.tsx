import { Button } from "@/components/ui/button";
import { getCoursesForTeacher } from "@/lib/actions";
import { signOut } from "@/lib/auth";
import { currentProfile } from "@/lib/currentProfile";

const TeacherPage = async () => {
  const teacher = await currentProfile();
  const coursesResponse =teacher?.username
  ? await getCoursesForTeacher(teacher?.username)
  : { error: "Username not found" };

  const isCourseResponse = (
    response: typeof coursesResponse
  ): response is { courses: { id: string; name: string; code: string; session: string; department: string }[] } =>
    'courses' in response && response.courses !== undefined;

  console.log(coursesResponse);

  return (
    <div className="ml-2">
      <div>{JSON.stringify(teacher)}</div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/auth/login" });
        }}
      >
        <Button type="submit">SignOut</Button>

        <h6 className="mb-8 text-sm">Assigned Courses</h6>
        {isCourseResponse(coursesResponse) && (
          <div className="flex flex-col">
            {coursesResponse.courses.map((course) => (
              <div key={course.id} className="mb-4">
                <h3>{course.name}</h3>
                <p>Code: {course.code}</p>
                
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default TeacherPage;