"use server";
import * as z from "zod";

import bcrypt from "bcryptjs";
import { db } from "./db";

import { signIn } from "./auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { FormSchema, LoginSchema } from "./Schema";
export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields=LoginSchema.safeParse(values);

  if(!validatedFields.success){
      return {error:"Invalid fields"}
  }
  const { email, password } = validatedFields.data;

  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return { error: "User not found" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch(error.type){
        case "CredentialsSignin":
          return {error:"Invalid Credentials"}
         
          default :
          return {error:"Something went wrong"}
      }
    }
    throw error;
  }

  return {success:"Success"};
};



export const signup = async (values: z.infer<typeof FormSchema>) => {
     const validatedFields=FormSchema.safeParse(values);
     if(!validatedFields.success){
      return {error:"Invalid fields"}
     }

     const {email,password,username,confirmPassword,role,branch}=validatedFields.data;
     const userBranch = branch !== undefined ? branch : "";
  
   if(password!==confirmPassword){
    return {error:"Passwords do not Match"};
   }

  const existingUser = await db.user.findUnique({
    where: {
      email,
    },
  });

  
 
  if(existingUser){
    return {error:"User Already Exists"};
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser=await db.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role
    },
  });
  if (role === "STUDENT") {
    await db.student.create({
      data: {
        userId: newUser.id,
        branch:userBranch,
      },
    });
  } else if (role === "TEACHER") {
    await db.teacher.create({
      data: {
        userId: newUser.id,
      },
    });
  } else if (role === "ADMIN") {
    return  {error:"you are not authorized to register as an admin"}
  }
  //login in user after sign up
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch(error.type){
        case "CredentialsSignin":
          return {error:"Invalid Credentials"}
         
          default :
          return {error:"Something went wrong"}
      }
    }
    throw error;
  }

  
  return  {success:"Successfully Registered"};
};
