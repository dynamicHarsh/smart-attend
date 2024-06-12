'use client';

import { addCourse } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { FormError } from '@/components/Form_error';
import { FormSuccess } from '@/components/Form_success';

const courseSchema = z.object({
  name: z.string().min(1, { message: 'Course name is required' }),
  code: z
    .string()
    .min(1, { message: 'Course code is required' })
    .regex(/^[A-Za-z0-9-]+$/, {
      message: 'Course code must be alphanumeric or contain hyphens',
    }),
    department:z.string().min(1,{message:'department name is required'}),
  session: z.string().min(1, { message: 'Session is required' }),
});

type CourseFormData = z.infer<typeof courseSchema>;

export function AddCoursePage() {
  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      code: '',
      department:"computer",
      session: '',
    },
  });

  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const onSubmit = (data: CourseFormData) => {
    startTransition(async () => {
      setError('');
      setSuccess('');
      const { success, error } = await addCourse(
        data.name,
        data.code,
        data.department,
        data.session
      );
      if (success) {
        setSuccess(success);
        form.reset();
      } else {
        setError(error);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter course name"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter course code"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
       <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isPending}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="  focus:ring-0 text-black ring-offset-0 focus:ring-offset-0 capitalize outline-none">
                        <SelectValue placeholder="Select Department" />
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
          name="session"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter session"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormError message={error} />
        <FormSuccess message={success} />
        <Button type="submit"  disabled={isPending}>
          {isPending ? 'Adding Course...' : 'Add Course'}
        </Button>
      </form>
    </Form>
  );
}