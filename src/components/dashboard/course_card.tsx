"use client"
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    code: string;
    session: string;
    department: string;
  };
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
    const pathName= usePathname();
   
    const url=pathName.includes("student")?`/dashboard/student/courses/${course.id}`:`/dashboard/teacher/courses/${course.id}`;
    
  return (
    <Card>
      <CardHeader>
        <CardTitle>
            <Link  href={url}>{course.code}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>{course.name}</p>
      </CardContent>
    </Card>
  );
};

export default CourseCard;