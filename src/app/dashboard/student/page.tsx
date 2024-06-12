import { Button } from "@/components/ui/button";
import { getEnrolledCourses } from "@/lib/actions";
import { signOut } from "@/lib/auth";
import { currentProfile } from "@/lib/currentProfile";

const StudentPage = async () => {
  const student = await currentProfile();
  const username = student?.username;

  const enrolledCoursesResponse = username
    ? await getEnrolledCourses(username)
    : { error: "Username not found" };

  const isEnrolledCoursesResponse = (
    response: typeof enrolledCoursesResponse
  ): response is { courses: { id: string; name: string; code: string; session: string; department: string }[] } =>
    'courses' in response && response.courses !== undefined;

  console.log(enrolledCoursesResponse);

  return (
    <div className="ml-2">
      <div>{JSON.stringify(student)}</div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/auth/login" });
        }}
      >
        <Button type="submit">SignOut</Button>

        <h2>Enrolled Courses</h2>
        {isEnrolledCoursesResponse(enrolledCoursesResponse) ? (
          <div className="flex flex-col">
            {enrolledCoursesResponse.courses.map((course) => (
              <div key={course.id} className="mb-4">
                <h3>{course.name}</h3>
                <p>Code: {course.code}</p>
                
              </div>
            ))}
          </div>
        ) : (
          <p>{enrolledCoursesResponse.error}</p>
        )}
      </form>
    </div>
  );
};

export default StudentPage;