export const dynamic = 'force-dynamic'

import GenerateQRCodeComponent from "@/components/dashboard/generate_qr_code";
import StudentCard from "@/components/dashboard/student_card";
import {  getStudentsByTeacherAndCourse } from "@/lib/actions";
import { currentProfile } from "@/lib/currentProfile";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

interface Student {
  username: string;
  email: string;
  branch: string;
}
type Props={
  params:{
      course_Id:string;
  };
 
}

const TeacherPage = async ({params:{course_Id}}:Props) => {
  const teacher = await currentProfile();
   
 

  if (!teacher?.teacher || teacher?.role === Role.STUDENT) {
    return redirect("/dashboard");
  }
  

  const studentsResponse: { students?: Student[]; error?: string } = teacher?.username
    ? await getStudentsByTeacherAndCourse(teacher?.username, course_Id)
    : { error: "Username not found" };

  const isStudentsResponse = (
    response: { students?: Student[]; error?: string }
  ): response is { students: Student[] } =>
    "students" in response && response.students !== undefined;

  

  return (
    <div className="ml-2">
      <GenerateQRCodeComponent courseId={course_Id} teacherId={teacher?.teacher?.id}/>
      <h1 className="mb-8  text-2xl font-semibold">Students Enrolled</h1>
      {isStudentsResponse(studentsResponse) && (
        <div className=" w-full grid grid-cols-1 gap-2 sm:grid-cols-1 md:grid-cols-2  xl:grid-cols-3">
          {studentsResponse.students.map((student) => (
             <div key={student.email} className="col-span-1">
            <StudentCard key={student.username} student={student} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherPage;
