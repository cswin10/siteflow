-- SiteFlow Initial Schema Migration
-- This migration creates all core tables for the SiteFlow application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- Extended user profile information linked to Supabase Auth
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'site_manager', 'worker', 'client')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================================
-- JOBS TABLE
-- Core table for tracking construction jobs/projects
-- ============================================================================
CREATE TABLE jobs (
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

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_start_date ON jobs(start_date);

-- ============================================================================
-- JOB_ASSIGNMENTS TABLE
-- Many-to-many relationship between jobs and workers
-- ============================================================================
CREATE TABLE job_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(job_id, worker_id)
);

CREATE INDEX idx_job_assignments_job_id ON job_assignments(job_id);
CREATE INDEX idx_job_assignments_worker_id ON job_assignments(worker_id);

-- ============================================================================
-- TASKS TABLE
-- Individual tasks within a job
-- ============================================================================
CREATE TABLE tasks (
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

CREATE INDEX idx_tasks_job_id ON tasks(job_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ============================================================================
-- SITE_DIARY_ENTRIES TABLE
-- Daily log entries for site managers
-- ============================================================================
CREATE TABLE site_diary_entries (
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

CREATE INDEX idx_site_diary_job_id ON site_diary_entries(job_id);
CREATE INDEX idx_site_diary_entry_date ON site_diary_entries(entry_date DESC);
CREATE INDEX idx_site_diary_created_by ON site_diary_entries(created_by);

-- ============================================================================
-- COMPLIANCE_LOGS TABLE
-- High-level compliance tracking per job
-- ============================================================================
CREATE TABLE compliance_logs (
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

CREATE INDEX idx_compliance_logs_job_id ON compliance_logs(job_id);
CREATE INDEX idx_compliance_logs_type ON compliance_logs(compliance_type);
CREATE INDEX idx_compliance_logs_status ON compliance_logs(status);
CREATE INDEX idx_compliance_logs_due_date ON compliance_logs(due_date);

-- ============================================================================
-- COMPLIANCE_ITEMS TABLE
-- Individual checklist items within a compliance log
-- ============================================================================
CREATE TABLE compliance_items (
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

CREATE INDEX idx_compliance_items_log_id ON compliance_items(compliance_log_id);
CREATE INDEX idx_compliance_items_worker_id ON compliance_items(worker_id);

-- ============================================================================
-- FILE_UPLOADS TABLE
-- Storage metadata for all uploaded files
-- ============================================================================
CREATE TABLE file_uploads (
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

CREATE INDEX idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX idx_file_uploads_related_to ON file_uploads(related_to_type, related_to_id);

-- ============================================================================
-- SMS_ALERTS TABLE
-- Log of all SMS notifications sent via Twilio
-- ============================================================================
CREATE TABLE sms_alerts (
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

CREATE INDEX idx_sms_alerts_recipient_id ON sms_alerts(recipient_id);
CREATE INDEX idx_sms_alerts_alert_type ON sms_alerts(alert_type);
CREATE INDEX idx_sms_alerts_status ON sms_alerts(status);

-- ============================================================================
-- JOB_UPDATES TABLE
-- Timeline of all updates/events for a job
-- ============================================================================
CREATE TABLE job_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('status_change', 'task_completed', 'photo_uploaded', 'diary_entry', 'compliance_update', 'comment')),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_updates_job_id ON job_updates(job_id);
CREATE INDEX idx_job_updates_type ON job_updates(update_type);
CREATE INDEX idx_job_updates_created_at ON job_updates(created_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_diary_updated_at BEFORE UPDATE ON site_diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_logs_updated_at BEFORE UPDATE ON compliance_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'worker');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to automatically create job updates
CREATE OR REPLACE FUNCTION create_job_update_on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO job_updates (job_id, update_type, title, description, created_by)
    VALUES (
      NEW.job_id,
      'task_completed',
      'Task Completed: ' || NEW.title,
      NEW.description,
      NEW.updated_at::TEXT::UUID -- Using a placeholder, adjust based on your auth setup
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_completion_update
  AFTER UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION create_job_update_on_task_complete();
