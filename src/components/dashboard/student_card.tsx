import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface StudentData {
  username: string;
  email: string;
  branch: string;
  id:string;
}

const StudentCard = ({ 
  student, 
  courseId 
}: { 
  student: StudentData, 
  courseId: string 
}) => {
  const url = `/dashboard/teacher/courses/${courseId}/${student.id}/attendance-record`;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link href={url}>{student.username}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Email: {student.email}</p>
        <p className="text-gray-600">Branch: {student.branch}</p>
      </CardContent>
    </Card>
  );
};

export default StudentCard;