
import { TableDemo } from "@/components/admin_dashboard/components/TableDemo";
import { redirect, useParams } from 'next/navigation';
import { currentProfile } from "@/lib/currentProfile";
import { Button } from "@/components/ui/button"; 
import Link from "next/link";
import { AttendancePercentage } from "@/components/dashboard/AttendancePercentage";

const CoursePage = async ({ 
  params 
}: { 
  params: { course_Id: string,student_id:string } 
}) => {
    console.log(params);
  const teacher=await currentProfile();
  if(!teacher?.teacher){
        return redirect("/dashboard")
  }
  const teacherId=teacher?.teacher.id;
  const course_Id  = params.course_Id;
  const studentId=params.student_id

  return (
    <div className=" w-full flex flex-col gap-6" >
      <AttendancePercentage studentId={studentId} courseId={course_Id} teacherId={teacherId}/>
      
      <TableDemo studentId={studentId} courseId={course_Id} />
    </div>
  );
};

export default CoursePage;
