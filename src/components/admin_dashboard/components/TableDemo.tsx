"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';
import { getAttendanceRecords } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownNarrowWide, ArrowUpDown, ArrowUpWideNarrow } from 'lucide-react';

// Enum for attendance status
type AttendanceStatus = 'PRESENT' | 'ABSENT';

// Expanded Type definition for AttendanceRecord
type AttendanceRecord = {
  id: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: AttendanceStatus;
  session: string;
  teacherId: string;
  attendanceLinkId: string;
  scanLocation: string | null;
  isPotentialProxy: boolean;
  createdAt: Date;
  updatedAt: Date;
  student: {
    user: {
      email: string;
      username: string;
    }
  };
  course: {
    name: string;
    code: string;
  };
};

// Props interface
interface TableDemoProps {   
  studentId?: string | null;   
  courseId?: string | null;   
  teacherId?: string | null; 
}

// Fuzzy search filter
const fuzzyFilter = (row: any, columnId: string, value: string, addMeta: any) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

// Debounced Input Component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  debounce?: number;
  [key: string]: any;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, onChange, debounce]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
    />
  );
}

// Status Badge Component
const StatusBadge: React.FC<{ status: AttendanceStatus; isPotentialProxy: boolean }> = ({ 
  status, 
  isPotentialProxy 
}) => {
  const getColor = () => {
    if (isPotentialProxy) return 'bg-yellow-300';
    if (status === 'PRESENT') return 'bg-green-300';
    return 'bg-gray-300';
  };

  const getText = () => {
    if (isPotentialProxy) return 'Potential Proxy';
    if (status === 'PRESENT') return 'Present';
    return 'Absent';
  };

  return (
    <div className={`${getColor()} text-white rounded-lg flex justify-center items-center p-1`}>
      {getText()}
    </div>
  );
};

// Sorting Symbol Component
const SortingSymbol = ({ isSorted, direction }: { 
  isSorted: boolean, 
  direction: false | 'asc' | 'desc' 
}) => {
  if (!isSorted) return <div className="ml-2 text-gray-400"><ArrowUpDown /></div>;
  return (
    <div className="ml-2">
      {direction === 'asc' ? <ArrowDownNarrowWide /> : <ArrowUpWideNarrow />}
    </div>
  );
};

export function TableDemo({    
  studentId = null,    
  courseId = null,    
  teacherId = null  
}: TableDemoProps) {   
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);   
  const [loading, setLoading] = useState<boolean>(true);   
  const [error, setError] = useState<string | null>(null);    
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Fetch attendance records when component mounts or when filters change
  useEffect(() => {     
    async function fetchData() {       
      try {         
        const records = await getAttendanceRecords(studentId, courseId, teacherId);         
        // Ensure records match the AttendanceRecord type
        const typedRecords = records.map((record:any) => ({
          ...record,
          student: record.student || { user: { email: '', username: '' } },
          course: record.course || { name: '', code: '' }
        }));
        
        setAttendanceRecords(typedRecords);       
      } catch (error) {         
        console.error("Error fetching attendance records:", error);         
        setError("Failed to load attendance records.");       
      } finally {         
        setLoading(false);       
      }     
    }      
    fetchData();   
  }, [studentId, courseId, teacherId]);    

  // Define columns for the table
  const columns = useMemo<ColumnDef<AttendanceRecord>[]>(() => [
    {
      header: 'Student Name',
      accessorKey: 'student.user.username',
    },
    {
      header: 'Email',
      accessorKey: 'student.user.email',
    },
    {
      header: 'Course',
      accessorKey: 'course.name',
      cell: ({ row }) => `${row.original.course.name} (${row.original.course.code})`,
    },
    {
      header: 'Date',
      accessorKey: 'date',
      cell: ({ row }) => new Date(row.original.date).toLocaleString(),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          isPotentialProxy={row.original.isPotentialProxy} 
        />
      ),
    },
  ], []);

  // Create table instance
  const table = useReactTable({
    data: attendanceRecords,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { 
      globalFilter,
      pagination,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Loading and error states
  if (loading) {     
    return <div>Loading...</div>;   
  }    

  if (error) {     
    return <div>{error}</div>;   
  }    

  return (     
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Attendance Records</h1>
        <div className="flex items-center gap-4">
          <span>Search:</span>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder="Search all columns..."
            className="p-2 font-lg shadow border border-block"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    className="p-2 border bg-gray-100 text-left"
                  >
                    {header.isPlaceholder ? null : (
                      <div 
                        className={header.column.getCanSort() ? 'cursor-pointer select-none flex' : 'flex'}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <SortingSymbol 
                          isSorted={header.column.getIsSorted() as boolean} 
                          direction={header.column.getIsSorted()} 
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 border-b">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            className='text-2xl'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"«"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className='text-2xl'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
           {"‹"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className='text-2xl'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {"›"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className='text-2xl'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {"»"}
          </Button>
        </div>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </strong>
          <span className="mx-2">|</span>
          <span>
            Showing {table.getRowModel().rows.length} of {attendanceRecords.length} records
          </span>
        </span>
      </div>
    </div>
  ); 
}