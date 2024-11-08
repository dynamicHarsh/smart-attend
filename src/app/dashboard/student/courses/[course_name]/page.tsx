import { Button } from "@/components/ui/button"
import Link from "next/link"

const CoursePage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Attendance Record of This Subject</h1>
      <Link href="/dashboard/student/courses/4f370980-4df4-4f32-8182-f0cc3f40ec69/mark_attendance">
        <Button variant="default">
          Mark Attendance
        </Button>
      </Link>
    </div>
  )
}

export default CoursePage