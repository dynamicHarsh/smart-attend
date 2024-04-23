
import type { NextAuthConfig } from "next-auth"
import bcrypt from "bcryptjs"
import credentials from "next-auth/providers/credentials"
import { db } from "./db";
import { LoginSchema } from "./Schema";
export default {
   providers: [
    credentials({
      async authorize(credentials){
      
        const validatedFields=LoginSchema.safeParse(credentials);
        if(validatedFields.success){
          const {email,password}=validatedFields.data;

          const user=await db.user.findUnique({
            where:{
              email:email
            }
          })
          

          if(!user || !user.password) return null;

          const passwordMatch= await bcrypt.compare(
            password,
            user.password
          );

          if(passwordMatch){
            return user;
          }
          
        }
        return null;

      }
    })
   ]
  
  } satisfies NextAuthConfig