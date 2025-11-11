/*
  # Academic Planning System Database Schema

  ## Overview
  This migration creates the complete database schema for an AI-powered academic planning and time management system.

  ## New Tables

  ### 1. `profiles`
  User profile information linked to auth.users
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `university` (text) - University name
  - `major` (text) - Academic major
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `courses`
  Student courses and class information
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `course_code` (text) - Course identifier (e.g., CS101)
  - `course_name` (text) - Full course name
  - `instructor` (text) - Professor name
  - `credits` (integer) - Credit hours
  - `semester` (text) - Academic semester
  - `schedule` (jsonb) - Class meeting times and locations
  - `created_at` (timestamptz)

  ### 3. `assignments`
  Course assignments and deadlines
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `course_id` (uuid) - References courses
  - `title` (text) - Assignment title
  - `description` (text) - Assignment details
  - `due_date` (timestamptz) - Deadline
  - `estimated_hours` (integer) - Time estimate
  - `priority` (text) - AI-calculated priority (high/medium/low)
  - `status` (text) - Completion status (pending/in_progress/completed)
  - `completed_at` (timestamptz) - Completion timestamp
  - `created_at` (timestamptz)

  ### 4. `study_sessions`
  Planned and completed study sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `assignment_id` (uuid) - References assignments (optional)
  - `title` (text) - Session title
  - `start_time` (timestamptz) - Session start
  - `end_time` (timestamptz) - Session end
  - `status` (text) - Session status
  - `actual_duration` (integer) - Actual minutes spent
  - `created_at` (timestamptz)

  ### 5. `personal_commitments`
  Non-academic commitments and events
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `title` (text) - Commitment title
  - `description` (text) - Details
  - `start_time` (timestamptz) - Start time
  - `end_time` (timestamptz) - End time
  - `recurring` (boolean) - Is recurring event
  - `recurrence_pattern` (jsonb) - Recurrence rules
  - `created_at` (timestamptz)

  ### 6. `ai_recommendations`
  AI-generated suggestions and insights
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `recommendation_type` (text) - Type of suggestion
  - `content` (jsonb) - Recommendation details
  - `priority` (integer) - Importance level
  - `status` (text) - User response status
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Policies for SELECT, INSERT, UPDATE, and DELETE operations
  - All policies require authentication

  ## Important Notes
  1. All timestamps use timestamptz for timezone awareness
  2. JSONB fields allow flexible storage of complex data structures
  3. Foreign keys ensure referential integrity
  4. Indexes added for frequently queried columns
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  university text DEFAULT '',
  major text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_code text NOT NULL,
  course_name text NOT NULL,
  instructor text DEFAULT '',
  credits integer DEFAULT 3,
  semester text NOT NULL,
  schedule jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own courses"
  ON courses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  due_date timestamptz NOT NULL,
  estimated_hours integer DEFAULT 2,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES assignments(id) ON DELETE SET NULL,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'scheduled',
  actual_duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions"
  ON study_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create personal_commitments table
CREATE TABLE IF NOT EXISTS personal_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  recurring boolean DEFAULT false,
  recurrence_pattern jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE personal_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commitments"
  ON personal_commitments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commitments"
  ON personal_commitments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commitments"
  ON personal_commitments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own commitments"
  ON personal_commitments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  content jsonb NOT NULL,
  priority integer DEFAULT 1,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON ai_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON ai_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_personal_commitments_user_id ON personal_commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);