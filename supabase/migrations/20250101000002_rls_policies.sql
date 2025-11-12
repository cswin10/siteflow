-- SiteFlow Row Level Security Policies
-- This migration enables RLS and creates policies for all tables

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
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

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to get the current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user is site manager
CREATE OR REPLACE FUNCTION is_site_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'site_manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user is assigned to a job
CREATE OR REPLACE FUNCTION is_assigned_to_job(job_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM job_assignments
    WHERE job_id = job_id_param AND worker_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user created a job
CREATE OR REPLACE FUNCTION is_job_creator(job_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM jobs
    WHERE id = job_id_param AND created_by = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user is the client for a job
CREATE OR REPLACE FUNCTION is_job_client(job_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM jobs
    WHERE id = job_id_param AND client_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Site managers can view worker and client profiles
CREATE POLICY "Site managers can view worker and client profiles"
  ON profiles FOR SELECT
  USING (
    is_site_manager() AND role IN ('worker', 'client')
  );

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can view profiles of people on their jobs
CREATE POLICY "Users can view profiles of job colleagues"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_assignments ja1
      WHERE ja1.worker_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM job_assignments ja2
        WHERE ja2.job_id = ja1.job_id
        AND ja2.worker_id = profiles.id
      )
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- JOBS TABLE POLICIES
-- ============================================================================

-- Admins can do everything with jobs
CREATE POLICY "Admins have full access to jobs"
  ON jobs FOR ALL
  USING (is_admin());

-- Site managers can create jobs
CREATE POLICY "Site managers can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (is_site_manager());

-- Site managers can view all jobs
CREATE POLICY "Site managers can view all jobs"
  ON jobs FOR SELECT
  USING (is_site_manager());

-- Site managers can update jobs they created
CREATE POLICY "Site managers can update their jobs"
  ON jobs FOR UPDATE
  USING (is_site_manager() AND (created_by = auth.uid() OR is_admin()));

-- Workers can view jobs they're assigned to
CREATE POLICY "Workers can view assigned jobs"
  ON jobs FOR SELECT
  USING (is_assigned_to_job(id));

-- Clients can view their jobs
CREATE POLICY "Clients can view their jobs"
  ON jobs FOR SELECT
  USING (client_id = auth.uid());

-- ============================================================================
-- JOB_ASSIGNMENTS TABLE POLICIES
-- ============================================================================

-- Admins and site managers can manage assignments
CREATE POLICY "Admins and site managers can manage assignments"
  ON job_assignments FOR ALL
  USING (is_site_manager());

-- Workers can view their own assignments
CREATE POLICY "Workers can view their assignments"
  ON job_assignments FOR SELECT
  USING (worker_id = auth.uid() OR is_assigned_to_job(job_id));

-- ============================================================================
-- TASKS TABLE POLICIES
-- ============================================================================

-- Admins can do everything with tasks
CREATE POLICY "Admins have full access to tasks"
  ON tasks FOR ALL
  USING (is_admin());

-- Site managers can manage tasks
CREATE POLICY "Site managers can manage tasks"
  ON tasks FOR ALL
  USING (is_site_manager());

-- Workers can view tasks for their jobs
CREATE POLICY "Workers can view their job tasks"
  ON tasks FOR SELECT
  USING (is_assigned_to_job(job_id));

-- Workers can update tasks assigned to them
CREATE POLICY "Workers can update their tasks"
  ON tasks FOR UPDATE
  USING (assigned_to = auth.uid());

-- Clients can view tasks for their jobs
CREATE POLICY "Clients can view job tasks"
  ON tasks FOR SELECT
  USING (is_job_client(job_id));

-- ============================================================================
-- SITE_DIARY_ENTRIES TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins have full access to diary entries"
  ON site_diary_entries FOR ALL
  USING (is_admin());

-- Site managers can create and manage diary entries
CREATE POLICY "Site managers can manage diary entries"
  ON site_diary_entries FOR ALL
  USING (is_site_manager());

-- Workers can view diary entries for their jobs
CREATE POLICY "Workers can view job diary entries"
  ON site_diary_entries FOR SELECT
  USING (is_assigned_to_job(job_id));

-- Clients can view diary entries for their jobs
CREATE POLICY "Clients can view job diary entries"
  ON site_diary_entries FOR SELECT
  USING (is_job_client(job_id));

-- ============================================================================
-- COMPLIANCE_LOGS TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins have full access to compliance logs"
  ON compliance_logs FOR ALL
  USING (is_admin());

-- Site managers can manage compliance logs
CREATE POLICY "Site managers can manage compliance logs"
  ON compliance_logs FOR ALL
  USING (is_site_manager());

-- Workers can view compliance logs for their jobs
CREATE POLICY "Workers can view job compliance logs"
  ON compliance_logs FOR SELECT
  USING (is_assigned_to_job(job_id));

-- Clients can view compliance logs for their jobs
CREATE POLICY "Clients can view job compliance logs"
  ON compliance_logs FOR SELECT
  USING (is_job_client(job_id));

-- ============================================================================
-- COMPLIANCE_ITEMS TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins have full access to compliance items"
  ON compliance_items FOR ALL
  USING (is_admin());

-- Site managers can manage compliance items
CREATE POLICY "Site managers can manage compliance items"
  ON compliance_items FOR ALL
  USING (is_site_manager());

-- Workers can view compliance items
CREATE POLICY "Workers can view compliance items"
  ON compliance_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM compliance_logs cl
      WHERE cl.id = compliance_items.compliance_log_id
      AND is_assigned_to_job(cl.job_id)
    )
  );

-- Workers can view items assigned to them
CREATE POLICY "Workers can view their compliance items"
  ON compliance_items FOR SELECT
  USING (worker_id = auth.uid());

-- ============================================================================
-- FILE_UPLOADS TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins have full access to files"
  ON file_uploads FOR ALL
  USING (is_admin());

-- Site managers can manage files
CREATE POLICY "Site managers can manage files"
  ON file_uploads FOR ALL
  USING (is_site_manager());

-- Users can upload files
CREATE POLICY "Users can upload files"
  ON file_uploads FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Users can view files they uploaded
CREATE POLICY "Users can view their uploads"
  ON file_uploads FOR SELECT
  USING (uploaded_by = auth.uid());

-- Users can view files related to their jobs
CREATE POLICY "Users can view job-related files"
  ON file_uploads FOR SELECT
  USING (
    (related_to_type = 'job' AND is_assigned_to_job(related_to_id))
    OR
    (related_to_type = 'task' AND EXISTS (
      SELECT 1 FROM tasks WHERE id = related_to_id AND is_assigned_to_job(job_id)
    ))
  );

-- ============================================================================
-- SMS_ALERTS TABLE POLICIES
-- ============================================================================

-- Admins can view all SMS alerts
CREATE POLICY "Admins can view all SMS alerts"
  ON sms_alerts FOR SELECT
  USING (is_admin());

-- Site managers can view all SMS alerts
CREATE POLICY "Site managers can view SMS alerts"
  ON sms_alerts FOR SELECT
  USING (is_site_manager());

-- Users can view their own SMS alerts
CREATE POLICY "Users can view their SMS alerts"
  ON sms_alerts FOR SELECT
  USING (recipient_id = auth.uid());

-- Only admins and site managers can insert SMS alerts
CREATE POLICY "Admins and site managers can create SMS alerts"
  ON sms_alerts FOR INSERT
  WITH CHECK (is_site_manager());

-- ============================================================================
-- JOB_UPDATES TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins have full access to job updates"
  ON job_updates FOR ALL
  USING (is_admin());

-- Site managers can manage job updates
CREATE POLICY "Site managers can manage job updates"
  ON job_updates FOR ALL
  USING (is_site_manager());

-- Users can view updates for their jobs
CREATE POLICY "Users can view their job updates"
  ON job_updates FOR SELECT
  USING (is_assigned_to_job(job_id));

-- Clients can view updates for their jobs
CREATE POLICY "Clients can view their job updates"
  ON job_updates FOR SELECT
  USING (is_job_client(job_id));

-- Users can create updates for jobs they're involved in
CREATE POLICY "Users can create job updates"
  ON job_updates FOR INSERT
  WITH CHECK (
    is_assigned_to_job(job_id) OR is_site_manager()
  );
