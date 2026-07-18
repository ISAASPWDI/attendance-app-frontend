export type UserRole = 'TEACHER' | 'DIRECTOR';

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  photoUrl?: string | null;
}

export interface UserDetail extends User {
  attendanceRecords: Array<{
    id: number;
    date: string;
    timeIn: string;
    timeOut: string | null;
    status: string;
    notes: string | null;
  }>;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}
