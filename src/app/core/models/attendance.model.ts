export type AttendanceStatus = 'Present' | 'Late' | 'Absent';

export type DayOfWeekKey =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface AttendanceRecordInput {
  date: string;
  timeIn: string;
  timeOut?: string | null;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface AttendanceRecord {
  id: number;
  date: string;
  dayOfWeek: string;
  timeIn: string;
  timeOut: string | null;
  status: AttendanceStatus;
  notes: string | null;
}

export interface AttendanceRecordWithUser {
  id: number;
  teacherId: number;
  teacherName: string;
  date: string;
  dayOfWeek: string;
  timeIn: string;
  timeOut: string | null;
  status: AttendanceStatus;
  notes: string | null;
}

export interface AttendanceFilter {
  teacherName?: string;
  status?: AttendanceStatus | '';
  fromDate?: string;
  toDate?: string;
  dayOfWeek?: DayOfWeekKey | '';
  sortBy?: 'date' | 'teacherName' | 'status';
  order?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface DashboardSummary {
  totalRecords: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
}
