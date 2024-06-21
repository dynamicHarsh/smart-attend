import { Role } from "@prisma/client";
import * as z from "zod";

export const LoginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must have than 8 characters'),
  });

  export const FormSchema = z.object({
    username: z.string().min(1, 'Username is required').max(100),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    role: z.nativeEnum(Role),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must have than 8 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
    branch: z.string().optional(),
    registrationNumber:z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Password do not match',
  });

  // lib/validations/assign-course-to-teacher.ts


export const AssignCourseToTeacherSchema = z.object({
  department: z.string(),
  courseId: z.string(),
});