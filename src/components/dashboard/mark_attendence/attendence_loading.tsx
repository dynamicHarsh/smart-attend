'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoadingComponent() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center">
            <Loader2 className="w-8 h-8 mr-2 animate-spin" />
            Marking Attendance...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">Please wait while we process your request.</p>
          <div className="w-full bg-blue-200 rounded-full h-2.5 dark:bg-blue-700">
            <div className="bg-blue-600 h-2.5 rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{width: '45%'}}></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}