import { Separator } from "@/components/ui/separator"
import { AddCoursePage} from "@/components/admin_dashboard/add-course"

export default function SettingsNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Add a Course</h3>
        <p className="text-sm text-muted-foreground">
          Enter the details of a course to add.
        </p>
      </div>
      <Separator />
      <AddCoursePage />
    </div>
  )
}
