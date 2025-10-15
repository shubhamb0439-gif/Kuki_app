export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: 'employer' | 'employee';
  profile_photo?: string;
  profession?: string;
  job_status?: 'looking_for_job' | 'working' | 'looking_for_helper' | 'personal';
  show_status_ring?: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: 'employer' | 'employee') => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface Employee {
  id: string;
  user_id: string;
  employer_id: string;
  name: string;
  email?: string;
  phone?: string;
  profile_photo?: string;
  status: 'active' | 'inactive';
  job_status?: 'looking_for_job' | 'working' | 'looking_for_helper' | 'personal';
  show_status_ring?: boolean;
  profession?: string;
  employment_type?: 'full_time' | 'part_time' | 'contract';
  working_hours_per_day?: number;
  working_days_per_month?: number;
  hourly_rate?: number;
  created_at: string;
}