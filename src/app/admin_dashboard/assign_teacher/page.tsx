import AssignCourseToTeacherForm from "@/components/admin_dashboard/assign_teacher"
import { Separator } from "@/components/ui/separator"

export default function SettingsAppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Teacher Assigning</h3>
        <p className="text-sm text-muted-foreground">
         Provide names of teacher and course to assign the teacher.
        </p>
      </div>
      <Separator />
      <AssignCourseToTeacherForm/>
    </div>
  )
}
