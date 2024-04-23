import { auth,signOut } from "@/lib/auth"
import { redirect } from "next/navigation";



const Dashboard =async () => {
    const session = await auth();
  return (<div>
    <div>{JSON.stringify(session)}</div>
    <form
    action={async ()=>{
        "use server";
       await signOut({ redirectTo: '/auth/login' });
        
        
    }}
    >
        <button type="submit">
            SignOut
        </button>
    </form>
    </div>

  )
}
export default Dashboard;