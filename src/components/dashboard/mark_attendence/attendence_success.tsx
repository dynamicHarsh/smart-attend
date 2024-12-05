import React from 'react';
import { AttendanceStatus } from "@prisma/client";
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SuccessComponentProps {
  message: string;
  status: AttendanceStatus;
  isPotentialProxy: boolean;
}

const SuccessComponent: React.FC<SuccessComponentProps> = ({ message, status, isPotentialProxy }) => {
  return (
    <Card className="max-w-md mx-auto mt-8">
      {status===AttendanceStatus.PRESENT && (
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-green-700 mb-4 flex items-center">
          <CheckCircle className="w-8 h-8 text-green-500 mr-2" />
          Success!
        </CardTitle>
        <p className="text-gray-700 mb-4">{message}</p>
      </CardHeader>
      )}
      <CardContent>
        
        
        {status === AttendanceStatus.ABSENT && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
            It appears that you are not physically present in the classroom
            </AlertDescription>
          </Alert>
        )}
        
        {isPotentialProxy && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warning: Your location suggests potential proxy attendance. This will be reviewed.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SuccessComponent;