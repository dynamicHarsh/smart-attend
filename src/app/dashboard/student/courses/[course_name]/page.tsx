
import { TableDemo } from "@/components/admin_dashboard/components/TableDemo";
import { redirect, useParams } from 'next/navigation';
import { currentProfile } from "@/lib/currentProfile";
import { Button } from "@/components/ui/button"; 
import Link from "next/link";
import { AttendancePercentage } from "@/components/dashboard/AttendancePercentage";
import { getTeacherByCourseAndId } from "@/lib/actions";

const CoursePage = async ({ 
  params 
}: { 
  params: { course_name: string } 
}) => {
  const course_name  = params.course_name;
  const profile = await currentProfile();

  if(!profile?.student){
    return redirect("/");
  }
  const studentId=profile?.student.id as string
  const enrollment= await getTeacherByCourseAndId(studentId,course_name);
  if(!enrollment?.teacher){
    return redirect("/")
  }
  const teacherId=enrollment.teacher.id;

  return (
    <div>
      <Link href={`${course_name}/mark_attendance`}><Button className='w-full mb-6  mt-6'>Mark Attendance</Button></Link>
      <AttendancePercentage studentId={studentId} courseId={course_name} teacherId={teacherId}/>
      
      <TableDemo studentId={profile?.student?.id} courseId={course_name} />
    </div>
  );
};

export default CoursePage;
