export const dynamic = 'force-dynamic'
import { Metadata } from "next"

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
  const teacher= await currentProfile();
  return (
    <>
    
      <div className=" space-y-6 p-10 pb-16">
      <div className="flex flex-col sm:flex-row sm:justify-between space-y-0.5 sm:items-center">
          <div className="w-full sm:w-auto">
            <h2 className="text-2xl font-bold tracking-tight sm:bg-white bg-zinc-50 px-4 sm:px-0 py-2 rounded-md text-center sm:text-left mb-2 sm:mb-0">
              Dashboard
            </h2>
            <p className="hidden sm:block text-muted-foreground text-center sm:text-left">
             Manage Students and maintain their Attendence
            </p>
          </div>
          <div className="flex sm:flex-col items-center justify-between sm:items-end">
            <h2 className="text-xl font-semibold">{teacher?.username}</h2>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/auth/login" });
              }}
            >
              <Button className="mt-2" type="submit">
                SignOut
              </Button>
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
