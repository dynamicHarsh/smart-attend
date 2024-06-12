"use server";
import * as z from "zod";

import bcrypt from "bcryptjs";
import { db } from "./db";

import { signIn } from "./auth";
import { DEFAULT_LOGIN_REDIRECT,DEFAULT_ADMIN_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { AssignCourseToTeacherSchema, FormSchema, LoginSchema } from "./Schema";
import { Role } from "@prisma/client";


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
  const role=user.role;
  let url=DEFAULT_LOGIN_REDIRECT;
  try {

    if(role===Role.ADMIN){
       url=DEFAULT_ADMIN_LOGIN_REDIRECT;
    }
    await signIn("credentials", {
      email,
      password,
      redirectTo: url,
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



export const signup = async (values: z.infer<typeof FormSchema>,path:string) => {
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
        department:userBranch,
      },
    });
  } else if (role === "ADMIN") {
    return  {error:"you are not authorized to register as an admin"}
  }
  //login in user after sign up
  if(path.includes("auth")){
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
}
  
  return  {success:`${username} as ${role} is added`};
};

// server/actions.ts

export async function addCourse(name: string, code: string, department: string, session: string) {
  try {
    // Check if the course already exists
    const existingCourse = await db.course.findFirst({
      where: {
        code,
        session,
      },
    });

    if (existingCourse) {
      return {  error: `Course with code ${code} and session ${session} already exists` };
    }

    // Create the new course
    const course = await db.course.create({
      data: {
        department,
        name,
        code,
        session,
      },
    });

    return { success:`${name} has been successfully Added` };
  } catch (error) {
    return { error: "Something went wrong" };
  }
}



 export const assignCourseToTeacher = async (values:{teacherName: string, courseName: string}) => {
  // Find the teacher by name
  const{teacherName,courseName}=values;
  const teacher = await db.teacher.findFirst({
    where: {
      user: {
        username: teacherName,
      },
    },
    include: {
      user: true,
    },
  });

  if (!teacher) {
    return {error:`Teacher with name ${teacherName} not found`};
  }

  // Find the course by name
  const course = await db.course.findFirst({
    where: {
      name: courseName,
    },
  });

  if (!course) {
    return {error:`Course with name ${courseName} not found`};
  }

  // Check if the departments match
  if (teacher.department !== course.department) {
    return {error:`Teacher's department (${teacher.department}) does not match course's department (${course.department})`};
  }

  // Check if the relationship already exists
  const existingRelation = await db.course.findFirst({
    where: {
      id: course.id,
      teachers: {
        some: {
          id: teacher.id,
        },
      },
    },
  });

  if (existingRelation) {
    return  {error:`Course ${courseName} is already assigned to ${teacherName}`}
  }

  // Assign the course to the teacher
  const updatedCourse = await db.course.update({
    where: {
      id: course.id,
    },
    data: {
      teachers: {
        connect: {
          id: teacher.id,
        },
      },
    },
  });

  return {success:`Course ${courseName} has been successfully assigned to ${teacherName}`};
};

export const getEnrolledCourses = async (studentName :string) => {
  // Find the course by name and include the teachers
  const studentWithCourses = await db.student.findFirst({
    where: {
      user: {
        username: studentName,
      },
    },
    include: {
      courses: true,
    },
  });

  if (!studentWithCourses) {
    return { error: `Student with name ${studentName} not found` };
  }
   
  return { courses: studentWithCourses.courses };
};


export const getCoursesForTeacher = async (teacherName:string) => {
  // Find the teacher by name and include the courses
  const teacherWithCourses = await db.teacher.findFirst({
    where: {
      user: {
        username: teacherName,
      },
    },
    include: {
      courses: true,
    },
  });

  if (!teacherWithCourses) {
    return { error: `Teacher with name ${teacherName} not found` };
  }
   
  return { courses: teacherWithCourses.courses };
};

export const enrollStudentInCourse = async (values: { studentName: string, teacherName: string, courseName: string }) => {
  const { studentName, teacherName, courseName } = values;

  // Find the student by user name
  const studentUser = await db.user.findFirst({
    where: {
      username: studentName,
    },
    include: {
      student: true,
    },
  });

  if (!studentUser || !studentUser.student) {
    return { error: `Student with name ${studentName} not found` };
  }

  const student = studentUser.student;

  // Find the teacher by user name
  const teacherUser = await db.user.findFirst({
    where: {
      username: teacherName,
    },
    include: {
      teacher: true,
    },
  });

  if (!teacherUser || !teacherUser.teacher) {
    return { error: `Teacher with name ${teacherName} not found` };
  }

  const teacher = teacherUser.teacher;

  // Find the course by name
  const course = await db.course.findFirst({
    where: {
      name: courseName,
    },
    include: {
      teachers: true,
      students: true,
    },
  });

  if (!course) {
    return { error: `Course with name ${courseName} not found` };
  }

  // Check if the course is assigned to the teacher
  const isCourseAssignedToTeacher = course.teachers.some(t => t.id === teacher.id);

  if (!isCourseAssignedToTeacher) {
    return { error: `Course ${courseName} is not assigned to teacher ${teacherName}` };
  }

  // Check if the student is already enrolled in the course
  const isStudentEnrolled = course.students.some(s => s.id === student.id);

  if (isStudentEnrolled) {
    return { error: `Student ${studentName} is already enrolled in course ${courseName}` };
  }

  // Enroll the student in the course
  const updatedCourse = await db.course.update({
    where: {
      id: course.id,
    },
    data: {
      students: {
        connect: {
          id: student.id,
        },
      },
    },
  });

  return { success: `Student ${studentName} has been successfully enrolled in course ${courseName}` };
};
