import { currentProfile } from "@/lib/currentProfile";
import { TableDemo } from "@/components/admin_dashboard/components/TableDemo";
import { Table } from "lucide-react";
import { redirect } from "next/navigation";

const Attendence =async () => {
  const profile=await currentProfile();
  if(!profile?.teacher){
    return redirect("/auth/login")
  }
  
  return (
    <TableDemo teacherId={profile?.teacher.id}/>
  )
}

export default Attendence