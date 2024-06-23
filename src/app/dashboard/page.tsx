export const dynamic = 'force-dynamic'

import { currentProfile } from "@/lib/currentProfile";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";


const Dashboard = async () => {
  
    const user = await currentProfile();

    if (!user) {
      redirect("auth/login");
    }
   

    if(user){
     return  <h1>{`hello there, welcome ${user.username}`}</h1>
    }
    // switch (user.role) {
    //   case Role.TEACHER:
    //     redirect("/dashboard/teacher");
    //   case Role.STUDENT:
    //     redirect("/dashboard/student");
    //   case Role.ADMIN:
    //     redirect("/admin_dashboard");
    //   default:
    //     redirect("/error");
    // }
  
  
};

export default Dashboard;