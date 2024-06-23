export const dynamic = "force-dynamic";
import { Metadata } from "next";
import Image from "next/image";

import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/admin_dashboard/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { currentProfile } from "@/lib/currentProfile";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description:
    "Dashboard for admin of AMS to create and manage accounts for students and teachers.Assign courses to teachers and enroll students in them",
};

const sidebarNavItems = [
  {
    title: "Account",
    href: "/admin_dashboard/account",
  },
  {
    title: "Add Course",
    href: "/admin_dashboard/add_course",
  },
  {
    title: "Assign Teacher",
    href: "/admin_dashboard/assign_teacher",
  },
  {
    title: "Enroll Students",
    href: "/admin_dashboard/enroll_students",
  },
  {
    title: "Analytics",
    href: "/admin_dashboard",
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  const admin = await currentProfile();
  return (
    <>
      <div className=" space-y-6 p-2 sm:p-10 pb-16">
        <div className="flex flex-col sm:flex-row sm:justify-between space-y-0.5 sm:items-center">
          <div className="w-full sm:w-auto">
            <h2 className="text-2xl font-bold tracking-tight sm:bg-white bg-zinc-50 px-4 sm:px-0 py-2 rounded-md text-center sm:text-left mb-2 sm:mb-0">
              Admin Dashboard
            </h2>
            <p className="hidden sm:block text-muted-foreground text-center sm:text-left">
              Manage Teachers, Students and Courses.
            </p>
          </div>
          <div className="flex sm:flex-col items-center justify-between sm:items-end">
            <h2 className="text-xl font-semibold">{admin?.username}</h2>
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
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  );
}
