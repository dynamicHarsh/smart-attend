
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface StudentData {
username: string;
email: string;
  branch: string;
}

const StudentCard = ({ student }: { student: StudentData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
            {student.username}
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
