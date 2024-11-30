import { currentProfile } from "@/lib/currentProfile";
import { TableDemo } from "@/components/admin_dashboard/components/TableDemo";

const Attendence =async () => {
  const profile=await currentProfile();
  return (
    <TableDemo studentId={profile?.student?.id}/>
  )
}

export default Attendence