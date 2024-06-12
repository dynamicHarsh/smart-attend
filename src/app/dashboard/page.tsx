import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth"
import { currentProfile } from "@/lib/currentProfile";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";


const Dashboard =async () => {
  const user= await currentProfile();


  if(user?.role===Role.TEACHER){
    return redirect("/dashboard/teacher")
  }
  if(user?.role===Role.STUDENT){
    return redirect("/dashboard/student");
  }  
  if(user?.role===Role.ADMIN){
    return redirect("/admin_dashboard");
  }
 
}
export default Dashboard;