"use client";

import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Link from "next/link";
import { signup } from "@/lib/actions";
import { useState, useTransition } from "react";
import { FormSchema } from "@/lib/Schema";
import { FormError } from "../Form_error";
import { FormSuccess } from "../Form_success";
import { Role } from "@prisma/client";
import { usePathname } from "next/navigation";

const SignUpForm = () => {
 
  const [selectedRole, setSelectedRole] = useState<Role>(Role.STUDENT);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const pathName=usePathname();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: Role.STUDENT,
      branch: "",
      confirmPassword: "",
      registrationNumber:"",
    },
  });

  const onSubmit = (values: z.infer<typeof FormSchema>) => {
    startTransition(() => {
      
      signup(values,pathName).then((data) => {
        setError(data?.error);
        setSuccess(data?.success);
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem >
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                     className="bg-white focus:ring-0 text-black ring-offset-0 focus:ring-offset-0 "
                    disabled={isPending}
                    placeholder="Enter your name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="mail@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  disabled={isPending}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedRole(value as Role);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="  focus:ring-0 text-black ring-offset-0 focus:ring-offset-0 capitalize outline-none">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Role).map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="capitalize"
                      >
                        {type !== Role.ADMIN && type.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        {selectedRole===Role.STUDENT &&(
           <FormField
           control={form.control}
           name="registrationNumber"
           render={({ field }) => (
             <FormItem >
               <FormLabel>Registration Number</FormLabel>
               <FormControl>
                 <Input
                    className="bg-white focus:ring-0 text-black ring-offset-0 focus:ring-offset-0 "
                   disabled={isPending}
                   placeholder="Enter your Registration number"
                   {...field}
                 />
               </FormControl>
               <FormMessage />
             </FormItem>
           )}
         />
        )}
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isPending}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="  focus:ring-0 text-black ring-offset-0 focus:ring-offset-0 capitalize outline-none">
                        <SelectValue placeholder="Select your branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Add  branch options here */}
                        <SelectItem value="computer">Computer</SelectItem>
                        <SelectItem value="mechanical">Mechanical</SelectItem>
                        {/* ... */}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
         
          <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Please Enter Password"
                  {...field}
                  type="password"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
           <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Please Re-Enter Password"
                  {...field}
                  type="password"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
        <FormError message={error} />
        <FormSuccess message={success} />
        <Button
          className=" mt-6"
          type="submit"
       
          disabled={isPending}
        >
          {isPending ? "Signing up..." : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-2">
        If you already have an account, please&nbsp;
        <Link className="text-blue-500 hover:underline" href="/auth/login">
          Sign in
        </Link>
      </p>
    </Form>
  );
};

export default SignUpForm;