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
import { assignCourseToTeacher, getAllTeachersAndCourses, } from "@/lib/actions";
import { useEffect, useState, useTransition } from "react";
import { FormError } from "../Form_error";
import { FormSuccess } from "../Form_success";

const AssignCourseToTeacherSchema = z.object({
  department: z.string().min(1, "Department is required"),
  teacherId: z.string().min(1, "Teacher name is required"),
  courseId: z.string().min(1, "Course name is required"),
});

type FormData = z.infer<typeof AssignCourseToTeacherSchema>;

const DEPARTMENTS = ["computer", "mechanical"];

interface Teacher {
  department: string;
  id: string;
  name: string;
}

interface Course {
  code: string;
  id: string;
  name: string;
  department: string;
}

interface TeachersAndCoursesResponse {
  teachers?: Teacher[];
  courses?: Course[];
  error?: string;
}

function isTeachersAndCoursesResponse(response: any): response is TeachersAndCoursesResponse {
  return (response as TeachersAndCoursesResponse).teachers !== undefined 
      && (response as TeachersAndCoursesResponse).courses !== undefined;
}

const AssignCourseToTeacherForm = () => {
  const [success, setSuccess] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [teachersAndCourses, setTeachersAndCourses] = useState<TeachersAndCoursesResponse>({});
  const [openTeacherDialog, setOpenTeacherDialog] = useState(false);
  const [openCourseDialog, setOpenCourseDialog] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(AssignCourseToTeacherSchema),
    defaultValues: {
      department: "",
      teacherId: "",
      courseId: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllTeachersAndCourses();
        if (isTeachersAndCoursesResponse(data)) {
          setTeachersAndCourses(data);
        } else {
          setError("Failed to fetch teachers and courses");
        }
      } catch (error) {
        setError("Failed to fetch teachers and courses");
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (values: FormData) => {
    startTransition(async () => {
      const data = await assignCourseToTeacher(values);
      setError(data?.error);
      setSuccess(data?.success);
    });
  };

  const selectedDepartment = form.watch('department');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full ">
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
                <FormLabel>Teacher Name</FormLabel>
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
                  >
                    {field.value
                      ? teachersAndCourses.teachers?.find((teacher) => teacher.id === field.value)?.name
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
                        {isTeachersAndCoursesResponse(teachersAndCourses) && teachersAndCourses.teachers?.map((teacher) => (
                          selectedDepartment === teacher.department && (
                            <CommandItem
                              key={teacher.id}
                              value={teacher.id}
                              onSelect={() => {
                                form.setValue("teacherId", teacher.id);
                                setOpenTeacherDialog(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === teacher.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {teacher.name}
                            </CommandItem>
                          )
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
                <FormLabel>Course Name</FormLabel>
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
                  >
                    {field.value
                      ? teachersAndCourses.courses?.find((course) => course.id === field.value)?.name
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
                        {isTeachersAndCoursesResponse(teachersAndCourses) && teachersAndCourses.courses?.map((course) => (
                          selectedDepartment === course.department && (
                            <CommandItem
                              key={course.id}
                              value={course.id}
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
                              {course.name}
                            </CommandItem>
                          )
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
          {isPending ? "Assigning..." : "Assign Course to Teacher"}
        </Button>
      </form>
    </Form>
  );
};

export default AssignCourseToTeacherForm;