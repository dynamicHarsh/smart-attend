"use client";

import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { enrollStudentInCourse, getTeachersByDepartment, getCoursesByDepartmentAndTeacher, getAllStudents } from "@/lib/actions";
import { useEffect, useState, useTransition } from "react";
import { FormError } from "../Form_error";
import { FormSuccess } from "../Form_success";

const EnrollStudentInCourseSchema = z.object({
  department: z.string().min(1, "Department is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  courseId: z.string().min(1, "Course is required"),
  studentId: z.string().min(1, "Student is required"),
});

type FormData = z.infer<typeof EnrollStudentInCourseSchema>;

const DEPARTMENTS = ["computer", "mechanical"];

interface Teacher {
  department:string;
  teacherId: string;
  username: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Student {
  id: string;
  username: string;
}

const EnrollStudentInCourseForm = () => {
  const [success, setSuccess] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [openTeacherDialog, setOpenTeacherDialog] = useState(false);
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [openStudentDialog, setOpenStudentDialog] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(EnrollStudentInCourseSchema),
    defaultValues: {
      department: "",
      teacherId: "",
      courseId: "",
      studentId: "",
    },
  });

  const selectedDepartment = form.watch('department');
  const selectedTeacherId = form.watch('teacherId');

  useEffect(() => {
    if (selectedDepartment) {
      getTeachersByDepartment(selectedDepartment).then((data) => {
        if (data.data) {
          setTeachers(data.data);
        } else {
          setError(data.error);
        }
      });
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDepartment && selectedTeacherId) {
      getCoursesByDepartmentAndTeacher(selectedDepartment, selectedTeacherId).then((data) => {
        if (data.data) {
          setCourses(data.data);
        } else {
          setError(data.error);
        }
      });
    }
  }, [selectedDepartment, selectedTeacherId]);

  useEffect(() => {
    getAllStudents().then((data) => {
      if (data.data) {
        setStudents(data.data);
      } else {
        setError(data.error);
      }
    });
  }, []);

  const onSubmit = async (values: FormData) => {
    startTransition(async () => {
      const data = await enrollStudentInCourse(values);
      setError(data?.error);
      setSuccess(data?.success);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teacherId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Teacher</FormLabel>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openTeacherDialog}
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenTeacherDialog(true);
                    }}
                    disabled={!selectedDepartment}
                  >
                    
                    {field.value
                      ? teachers.find((teacher) => teacher.teacherId===field.value)?.username
                      : "Select teacher..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
                <CommandDialog open={openTeacherDialog} onOpenChange={setOpenTeacherDialog}>
                  <Command>
                    <CommandInput placeholder="Search teacher..." />
                    <CommandEmpty>No teacher found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {teachers.map((teacher) => (
                          <CommandItem
                            key={teacher.teacherId}
                            value={teacher.username}
                            onSelect={() => {
                              form.setValue("teacherId", teacher.teacherId);
                              form.setValue("courseId", ""); // Reset course when teacher changes
                              setOpenTeacherDialog(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === teacher.teacherId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {teacher.username}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </CommandDialog>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Course</FormLabel>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCourseDialog}
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenCourseDialog(true)
                    }}
                    disabled={!selectedTeacherId}
                  >
                    {field.value
                      ? courses.find((course) => course.id === field.value)?.name
                      : "Select course..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
                <CommandDialog open={openCourseDialog} onOpenChange={setOpenCourseDialog}>
                  <Command>
                    <CommandInput placeholder="Search course..." />
                    <CommandEmpty>No course found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {courses.map((course) => (
                          <CommandItem
                            key={course.id}
                            value={course.name}
                            onSelect={() => {
                              form.setValue("courseId", course.id);
                              setOpenCourseDialog(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === course.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {`${course.name} (${course.code})`}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </CommandDialog>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Student</FormLabel>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openStudentDialog}
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenStudentDialog(true)
                    }}
                  >
                    {field.value
                      ? students.find((student) => student.id === field.value)?.username
                      : "Select student..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
                <CommandDialog open={openStudentDialog} onOpenChange={setOpenStudentDialog}>
                  <Command>
                    <CommandInput placeholder="Search student..." />
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {students.map((student) => (
                          <CommandItem
                            key={student.id}
                            value={student.username}
                            onSelect={() => {
                              form.setValue("studentId", student.id);
                              setOpenStudentDialog(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === student.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {student.username}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </CommandDialog>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormError message={error}/>
        <FormSuccess message={success}/>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enrolling..." : "Enroll Student in Course"}
        </Button>
      </form>
    </Form>
  );
};

export default EnrollStudentInCourseForm;