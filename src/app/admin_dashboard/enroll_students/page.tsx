import { Separator } from "@/components/ui/separator"
import EnrollStudentInCourseForm from "@/components/admin_dashboard/enroll-student"

export default function SettingsDisplayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Student Enrollment</h3>
        <p className="text-sm text-muted-foreground">
         Provide name of Student,Teacher and Course to enroll the Student.
        </p>
      </div>
      <Separator />
      <EnrollStudentInCourseForm/>
    </div>
  )
}
