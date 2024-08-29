import React from 'react';
import { AttendanceStatus } from "@prisma/client";
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

interface SuccessComponentProps {
  message: string;
  status: AttendanceStatus;
  isPotentialProxy: boolean;
}

const SuccessComponent: React.FC<SuccessComponentProps> = ({ message, status, isPotentialProxy }) => {
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-4">
        <CheckCircle className="w-8 h-8 text-green-500 mr-2" />
        <h2 className="text-2xl font-bold text-green-700">Success!</h2>
      </div>
      
      <p className="text-gray-700 mb-4">{message}</p>
      
      {status === AttendanceStatus.ABSENT && (
        <div className="flex items-center p-4 mb-4 bg-yellow-100 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
          <p className="text-yellow-700">
            Your attendance was marked as absent due to location mismatch.
          </p>
        </div>
      )}
      
      {isPotentialProxy && (
        <div className="flex items-center p-4 bg-red-100 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
          <p className="text-red-700">
            Warning: Your location suggests potential proxy attendance. This will be reviewed.
          </p>
        </div>
      )}
    </div>
  );
};

export default SuccessComponent;