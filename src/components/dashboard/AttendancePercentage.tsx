import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getStudentAttendancePercentage } from '@/lib/actions';

interface AttendancePercentageProps {
  studentId: string;
  courseId: string;
  teacherId: string;
}

export const AttendancePercentage: React.FC<AttendancePercentageProps> = async ({
  studentId,
  courseId,
  teacherId
}) => {
  let attendanceData;
  try {
    attendanceData = await getStudentAttendancePercentage(studentId, courseId, teacherId);
  } catch (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Attendance Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Unable to fetch attendance data</p>
        </CardContent>
      </Card>
    );
  }

 

  return (
    <Card className="w-full mt-8 mb-8">
      <CardHeader>
        <CardTitle>Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Responsive layout for sessions */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="flex flex-row w-full gap-4 justify-between sm:flex-row sm:w-auto">
            <p className="text-muted-foreground">Total Sessions</p>
            <p className="font-semibold">{attendanceData.totalSessions}</p>
          </div>
          <div className="flex flex-row w-full gap-4 justify-between sm:flex-row sm:w-auto">
            <p className="text-muted-foreground ">Present Sessions</p>
            <p className="font-semibold">{attendanceData.presentSessions}</p>
          </div>
        </div>
        
        {/* Attendance Percentage */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Attendance Percentage</span>
            <span className={`font-bold `}>
              {attendanceData.attendancePercentage}%
            </span>
          </div>
          <Progress
            value={attendanceData.attendancePercentage}
            className={`h-4 bg-slate-200`}
          />
        </div>
      </CardContent>
    </Card>
  );
};