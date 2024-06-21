import { Separator } from "@/components/ui/separator"
import Analytics from "@/components/admin_dashboard/Analytics"
import { currentProfile } from "@/lib/currentProfile"
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const profile= await currentProfile();

  if(profile?.role!==Role.ADMIN){
    return redirect("/dashboard");
  }
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Analyitics</h3>
        <p className="text-sm text-muted-foreground">
         Attendence records of Students
        </p>
      </div>
      <Separator />
      <Analytics />
    </div>
  )
}
