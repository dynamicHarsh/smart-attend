import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth"
import { currentProfile } from "@/lib/currentProfile";


const Dashboard =async () => {
  const user= await currentProfile();
    
  return (<div className="ml-2">
    <div>{JSON.stringify(user)} </div>
   
    <form
    action={async ()=>{
        "use server";
       await signOut({ redirectTo: '/auth/login' });
        
        
    }}
    >
      <Button  type="submit">SignOut</Button>
        
            
        
    </form>
    </div>

  )
}
export default Dashboard;