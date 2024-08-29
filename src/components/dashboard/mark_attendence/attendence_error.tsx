'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ErrorComponent({ message }: { message: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 mr-2" />
            Oops! An Error Occurred
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">{message}</p>
          <Button 
            onClick={() => router.push('/dashboard/student')}
            className="bg-gradient-to-r from-red-400 to-orange-500 hover:from-red-500 hover:to-orange-600"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}