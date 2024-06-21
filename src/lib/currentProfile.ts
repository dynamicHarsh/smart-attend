import { auth } from "./auth";
import { db } from "./db";

export const currentProfile = async () => {
    const session = await auth();
    
    if (!session) {
        return null;
    }

    const profile = await db.user.findUnique({
        where: {
            id: session.user?.id
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

    return {
        ...profile,
        studentId: profile.student?.id,
        teacherId: profile.teacher?.id,
        adminId: profile.admin?.id
    };
};