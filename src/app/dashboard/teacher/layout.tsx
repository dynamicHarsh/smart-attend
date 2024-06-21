import { Metadata } from "next"
import Image from "next/image"

import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "@/components/admin_dashboard/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth"
import { currentProfile } from "@/lib/currentProfile"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Dashboard for admin of AMS to create and manage accounts for students and teachers.Assign courses to teachers and enroll students in them",
}

const sidebarNavItems = [
 
  {
    title: "Courses",
    href: "/dashboard/teacher",
  },
  {
    title:"Attendence Records",
    href:"/dashboard/teacher/attendence_records",
  }
 
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const admin= await currentProfile();
  return (
    <>
    
      <div className=" space-y-6 p-10 pb-16">
        <div className=" flex justify-between  space-y-0.5 items-center">
          <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
         Manage Courses and Attendence Records for students
          </p>
          </div>
          <div className="">
          <h2 className="text-2xl font-bold tracking-tight">{admin?.username}</h2>
          <form
        action={async ()=>{
            "use server";
               await signOut({ redirectTo: '/auth/login' });
            }}
        >
          <Button className=" ml-28" type="submit">SignOut</Button>   
        </form>
        </div>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 w-full">{children}</div>
        </div>
      </div>
    </>
  )
}
