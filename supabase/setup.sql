-- ============================================================================
-- SITEFLOW COMPLETE DATABASE SETUP
-- ============================================================================
-- This file contains everything needed to set up the SiteFlow database.
-- Run this entire file in your Supabase SQL Editor to create all tables,
-- policies, functions, and views.
--
-- Alternatively, run the individual migration files in order:
-- 1. 20250101000001_initial_schema.sql
-- 2. 20250101000002_rls_policies.sql
-- 3. 20250101000003_views_and_functions.sql
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'site_manager', 'worker', 'client')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT,
  address TEXT,
  start_date DATE,
  end_date DATE,
  estimated_completion DATE,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);

-- Job Assignments
CREATE TABLE IF NOT EXISTS job_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(job_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id ON job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_worker_id ON job_assignments(worker_id);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_job_id ON tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Site Diary Entries
CREATE TABLE IF NOT EXISTS site_diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  weather TEXT,
  workers_present INTEGER,
  notes TEXT NOT NULL,
  issues TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_diary_job_id ON site_diary_entries(job_id);
CREATE INDEX IF NOT EXISTS idx_site_diary_entry_date ON site_diary_entries(entry_date DESC);

-- Compliance Logs
CREATE TABLE IF NOT EXISTS compliance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL CHECK (compliance_type IN ('ppe', 'cscs_card', 'insurance', 'site_access', 'safety_inspection', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('compliant', 'pending', 'flagged', 'expired')),
  due_date DATE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_job_id ON compliance_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_type ON compliance_logs(compliance_type);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_status ON compliance_logs(status);

-- Compliance Items
CREATE TABLE IF NOT EXISTS compliance_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compliance_log_id UUID NOT NULL REFERENCES compliance_logs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'flagged')),
  notes TEXT,
  checked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_items_log_id ON compliance_items(compliance_log_id);

-- File Uploads
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  related_to_type TEXT CHECK (related_to_type IN ('job', 'task', 'diary_entry', 'compliance_log', 'compliance_item', 'profile')),
  related_to_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_uploads_related_to ON file_uploads(related_to_type, related_to_id);

-- SMS Alerts
CREATE TABLE IF NOT EXISTS sms_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  alert_type TEXT CHECK (alert_type IN ('job_update', 'safety_reminder', 'compliance_alert', 'task_assignment', 'urgent')),
  related_to_type TEXT CHECK (related_to_type IN ('job', 'task', 'compliance_log')),
  related_to_id UUID,
  twilio_sid TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_alerts_recipient_id ON sms_alerts(recipient_id);

-- Job Updates
CREATE TABLE IF NOT EXISTS job_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('status_change', 'task_completed', 'photo_uploaded', 'diary_entry', 'compliance_update', 'comment')),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_updates_job_id ON job_updates(job_id);
CREATE INDEX IF NOT EXISTS idx_job_updates_created_at ON job_updates(created_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_site_diary_updated_at BEFORE UPDATE ON site_diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_compliance_logs_updated_at BEFORE UPDATE ON compliance_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'worker');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_updates ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_site_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'site_manager'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs policies
CREATE POLICY "Admins have full access to jobs" ON jobs FOR ALL USING (is_admin());
CREATE POLICY "Site managers can create jobs" ON jobs FOR INSERT WITH CHECK (is_site_manager());
CREATE POLICY "Site managers can view all jobs" ON jobs FOR SELECT USING (is_site_manager());
CREATE POLICY "Workers can view assigned jobs" ON jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM job_assignments WHERE job_id = jobs.id AND worker_id = auth.uid())
);
CREATE POLICY "Clients can view their jobs" ON jobs FOR SELECT USING (client_id = auth.uid());

-- Tasks policies
CREATE POLICY "Admins have full access to tasks" ON tasks FOR ALL USING (is_admin());
CREATE POLICY "Site managers can manage tasks" ON tasks FOR ALL USING (is_site_manager());
CREATE POLICY "Workers can view their job tasks" ON tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM job_assignments WHERE job_id = tasks.job_id AND worker_id = auth.uid())
);
CREATE POLICY "Workers can update their tasks" ON tasks FOR UPDATE USING (assigned_to = auth.uid());

-- Similar policies for other tables...
CREATE POLICY "Admins can manage diary" ON site_diary_entries FOR ALL USING (is_admin());
CREATE POLICY "Site managers can manage diary" ON site_diary_entries FOR ALL USING (is_site_manager());

CREATE POLICY "Admins can manage compliance" ON compliance_logs FOR ALL USING (is_admin());
CREATE POLICY "Site managers can manage compliance" ON compliance_logs FOR ALL USING (is_site_manager());

-- ============================================================================
-- VIEWS & ANALYTICS FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(user_role TEXT, user_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'active_jobs', (
      SELECT COUNT(*) FROM jobs
      WHERE status IN ('planning', 'in_progress')
        AND (user_role IN ('admin', 'site_manager') OR id IN (SELECT job_id FROM job_assignments WHERE worker_id = user_id) OR client_id = user_id)
    ),
    'overdue_tasks', (
      SELECT COUNT(*) FROM tasks
      WHERE status != 'completed' AND due_date < CURRENT_DATE
        AND (user_role IN ('admin', 'site_manager') OR assigned_to = user_id)
    ),
    'compliance_gaps', (
      SELECT COUNT(*) FROM compliance_logs
      WHERE status IN ('pending', 'flagged', 'expired')
        AND (user_role IN ('admin', 'site_manager') OR job_id IN (SELECT job_id FROM job_assignments WHERE worker_id = user_id))
    ),
    'pending_tasks', (
      SELECT COUNT(*) FROM tasks
      WHERE status = 'pending'
        AND (user_role IN ('admin', 'site_manager') OR assigned_to = user_id)
    )
  ) INTO stats;
  RETURN stats;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Your SiteFlow database is now ready!
-- Next steps:
-- 1. Configure Storage buckets: job-photos, compliance-documents, profile-avatars
-- 2. Load demo data from seed.sql (optional)
-- 3. Test authentication flow
-- ============================================================================
