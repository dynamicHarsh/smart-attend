import { auth } from "./auth";

import { db } from "./db";

export const currentProfile= async ()=>{
    const session= await auth();
    if(!session){
        return null;
    }
    const profile=  await db.user.findUnique({
        where:{
            id:session.user?.id
        },
        select:{
            id:true,
            email:true,
            username:true,
            role:true
        }
       

    })
    return profile;
} 