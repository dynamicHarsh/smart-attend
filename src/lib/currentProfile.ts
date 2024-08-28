import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";

export const currentProfile = async () => {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            
        return redirect("/auth/login");
           
        }

        const profile = await db.user.findUnique({
            where: {
                id: session.user.id
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                student: {
                    select: {
                        id: true
                    }
                },
                teacher: {
                    select: {
                        id: true
                    }
                },
                admin: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (!profile) {
            return null;
        }

        return profile;
            
    } catch (error) {
        console.error("Error in currentProfile:", error);
        return null;
    } 
};