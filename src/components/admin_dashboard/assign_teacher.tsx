"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assignCourseToTeacher, } from "@/lib/actions";
import { useState, useTransition } from "react";
import { FormError } from "../Form_error";
import { FormSuccess } from "../Form_success";

const AssignCourseToTeacherSchema = z.object({
  teacherName: z.string().min(1, "Teacher name is required"),
  courseName: z.string().min(1, "Course name is required"),
});

type FormData = z.infer<typeof AssignCourseToTeacherSchema>;

const AssignCourseToTeacherForm = () => {
  const [success, setSuccess] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(AssignCourseToTeacherSchema),
    defaultValues: {
      teacherName: "",
      courseName: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    startTransition(async () => {
      const data = await assignCourseToTeacher(values);
      setError(data?.error);
      setSuccess(data?.success);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="teacherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher Name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter teacher name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courseName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter course name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormError message={error}/>
        <FormSuccess message={success}/>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Assigning..." : "Assign Course to Teacher"}
        </Button>
      </form>
    </Form>
  );
};

export default AssignCourseToTeacherForm;