import { auth } from "./auth";
import { db } from "./db";

export const currentProfile = async () => {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return null;
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
    } finally {
        // If you're not using a connection pool, you might need to explicitly close the connection
        // await db.$disconnect();
    }
};