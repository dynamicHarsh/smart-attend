/*

An array  of routes that are accessible to the public
*/

export const publicRoutes=[
    "/",
];

export const authRoutes=[
    "/auth/login",
    "/auth/signup",
   
];

export const apiAuthPrefix="/api/auth"

export const DEFAULT_LOGIN_REDIRECT="/dashboard"
export const DEFAULT_STUDENT_LOGIN_REDIRECT="/dashboard/student"
export const DEFAULT_TEACHER_LOGIN_REDIRECT="/dashboard/teacher"
export const DEFAULT_ADMIN_LOGIN_REDIRECT="/admin_dashboard"