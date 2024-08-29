import { AttendanceStatus } from "@prisma/client";

interface SuccessComponentProps {
  message: string;
  status: AttendanceStatus;
  isPotentialProxy: boolean;
}

const SuccessComponent: React.FC<SuccessComponentProps> = ({ message, status, isPotentialProxy }) => {
  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Success!</strong>
      <span className="block sm:inline"> {message}</span>
      {status === AttendanceStatus.ABSENT && (
        <p className="mt-2 text-yellow-600">
          Your attendance was marked as absent due to location mismatch.
        </p>
      )}
      {isPotentialProxy && (
        <p className="mt-2 text-red-600">
          Warning: Your location suggests potential proxy attendance. This will be reviewed.
        </p>
      )}
    </div>
  );
};

export default SuccessComponent;