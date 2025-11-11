import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  university: string;
  major: string;
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  user_id: string;
  course_code: string;
  course_name: string;
  instructor: string;
  credits: number;
  semester: string;
  schedule: any[];
  created_at: string;
};

export type Assignment = {
  id: string;
  user_id: string;
  course_id?: string;
  title: string;
  description: string;
  due_date: string;
  estimated_hours: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  created_at: string;
};

export type StudySession = {
  id: string;
  user_id: string;
  assignment_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  actual_duration: number;
  created_at: string;
};

export type Recommendation = {
  id: string;
  user_id: string;
  recommendation_type: string;
  content: any;
  priority: number;
  status: string;
  created_at: string;
};
