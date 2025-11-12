-- SiteFlow Database Views and Additional Functions
-- This migration creates useful views for dashboards and analytics

-- ============================================================================
-- VIEW: v_job_dashboard
-- Aggregated view of jobs with completion stats and compliance status
-- ============================================================================
CREATE OR REPLACE VIEW v_job_dashboard AS
SELECT
  j.id,
  j.site_name,
  j.client_name,
  j.status,
  j.start_date,
  j.end_date,
  j.estimated_completion,
  j.created_at,
  j.updated_at,
  -- Task statistics
  COUNT(DISTINCT t.id) AS total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) AS completed_tasks,
  CASE
    WHEN COUNT(DISTINCT t.id) > 0 THEN
      ROUND((COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)::NUMERIC / COUNT(DISTINCT t.id)::NUMERIC) * 100, 2)
    ELSE 0
  END AS completion_percentage,
  -- Worker count
  COUNT(DISTINCT ja.worker_id) AS assigned_workers,
  -- Recent activity
  MAX(ju.created_at) AS last_update_at,
  -- Compliance stats
  COUNT(DISTINCT cl.id) AS total_compliance_logs,
  COUNT(DISTINCT CASE WHEN cl.status = 'flagged' THEN cl.id END) AS flagged_compliance,
  COUNT(DISTINCT CASE WHEN cl.status = 'expired' THEN cl.id END) AS expired_compliance,
  COUNT(DISTINCT CASE WHEN cl.status = 'pending' THEN cl.id END) AS pending_compliance,
  -- Overdue tasks
  COUNT(DISTINCT CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN t.id END) AS overdue_tasks
FROM jobs j
LEFT JOIN tasks t ON j.id = t.job_id
LEFT JOIN job_assignments ja ON j.id = ja.job_id
LEFT JOIN job_updates ju ON j.id = ju.job_id
LEFT JOIN compliance_logs cl ON j.id = cl.job_id
GROUP BY j.id;

-- ============================================================================
-- VIEW: v_compliance_summary
-- Summary of compliance status by job and type
-- ============================================================================
CREATE OR REPLACE VIEW v_compliance_summary AS
SELECT
  cl.job_id,
  j.site_name,
  cl.compliance_type,
  cl.status,
  COUNT(cl.id) AS log_count,
  COUNT(ci.id) AS total_items,
  COUNT(CASE WHEN ci.status = 'completed' THEN ci.id END) AS completed_items,
  COUNT(CASE WHEN ci.status = 'flagged' THEN ci.id END) AS flagged_items,
  MIN(cl.due_date) AS earliest_due_date,
  MAX(cl.verified_at) AS last_verified_at
FROM compliance_logs cl
LEFT JOIN compliance_items ci ON cl.id = ci.compliance_log_id
LEFT JOIN jobs j ON cl.job_id = j.id
GROUP BY cl.job_id, j.site_name, cl.compliance_type, cl.status;

-- ============================================================================
-- VIEW: v_worker_assignments
-- View of all worker assignments with job and worker details
-- ============================================================================
CREATE OR REPLACE VIEW v_worker_assignments AS
SELECT
  ja.id AS assignment_id,
  ja.job_id,
  j.site_name,
  j.status AS job_status,
  ja.worker_id,
  p.full_name AS worker_name,
  p.email AS worker_email,
  p.phone_number AS worker_phone,
  ja.role AS assignment_role,
  ja.assigned_at,
  -- Task stats for this worker on this job
  COUNT(DISTINCT t.id) AS assigned_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) AS completed_tasks
FROM job_assignments ja
JOIN jobs j ON ja.job_id = j.id
JOIN profiles p ON ja.worker_id = p.id
LEFT JOIN tasks t ON t.job_id = ja.job_id AND t.assigned_to = ja.worker_id
GROUP BY ja.id, ja.job_id, j.site_name, j.status, ja.worker_id,
         p.full_name, p.email, p.phone_number, ja.role, ja.assigned_at;

-- ============================================================================
-- VIEW: v_recent_activity
-- Recent activity across all jobs for dashboard feed
-- ============================================================================
CREATE OR REPLACE VIEW v_recent_activity AS
SELECT
  ju.id,
  ju.job_id,
  j.site_name,
  ju.update_type,
  ju.title,
  ju.description,
  ju.created_by,
  p.full_name AS created_by_name,
  ju.created_at
FROM job_updates ju
JOIN jobs j ON ju.job_id = j.id
LEFT JOIN profiles p ON ju.created_by = p.id
ORDER BY ju.created_at DESC;

-- ============================================================================
-- FUNCTION: calculate_job_completion
-- Calculate completion percentage for a specific job
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_job_completion(job_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  completion_pct NUMERIC;
BEGIN
  SELECT
    COUNT(*),
    COUNT(CASE WHEN status = 'completed' THEN 1 END)
  INTO total_tasks, completed_tasks
  FROM tasks
  WHERE job_id = job_id_param;

  IF total_tasks = 0 THEN
    RETURN 0;
  END IF;

  completion_pct := (completed_tasks::NUMERIC / total_tasks::NUMERIC) * 100;
  RETURN ROUND(completion_pct, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: get_overdue_tasks
-- Get all overdue tasks for a specific job or user
-- ============================================================================
CREATE OR REPLACE FUNCTION get_overdue_tasks(
  job_id_param UUID DEFAULT NULL,
  user_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  task_id UUID,
  job_id UUID,
  site_name TEXT,
  task_title TEXT,
  due_date DATE,
  days_overdue INTEGER,
  assigned_to UUID,
  assigned_to_name TEXT,
  priority TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.job_id,
    j.site_name,
    t.title,
    t.due_date,
    (CURRENT_DATE - t.due_date)::INTEGER AS days_overdue,
    t.assigned_to,
    p.full_name,
    t.priority
  FROM tasks t
  JOIN jobs j ON t.job_id = j.id
  LEFT JOIN profiles p ON t.assigned_to = p.id
  WHERE t.status != 'completed'
    AND t.due_date < CURRENT_DATE
    AND (job_id_param IS NULL OR t.job_id = job_id_param)
    AND (user_id_param IS NULL OR t.assigned_to = user_id_param)
  ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: get_compliance_gaps
-- Identify compliance gaps and upcoming deadlines
-- ============================================================================
CREATE OR REPLACE FUNCTION get_compliance_gaps(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  compliance_id UUID,
  job_id UUID,
  site_name TEXT,
  compliance_type TEXT,
  title TEXT,
  status TEXT,
  due_date DATE,
  days_until_due INTEGER,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id,
    cl.job_id,
    j.site_name,
    cl.compliance_type,
    cl.title,
    cl.status,
    cl.due_date,
    (cl.due_date - CURRENT_DATE)::INTEGER AS days_until_due,
    (cl.due_date < CURRENT_DATE) AS is_overdue
  FROM compliance_logs cl
  JOIN jobs j ON cl.job_id = j.id
  WHERE cl.status IN ('pending', 'flagged', 'expired')
    AND (cl.due_date IS NULL OR cl.due_date <= CURRENT_DATE + days_ahead)
  ORDER BY
    CASE WHEN cl.due_date < CURRENT_DATE THEN 0 ELSE 1 END,
    cl.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: get_job_timeline
-- Get a chronological timeline of events for a job
-- ============================================================================
CREATE OR REPLACE FUNCTION get_job_timeline(job_id_param UUID)
RETURNS TABLE (
  event_id UUID,
  event_type TEXT,
  event_title TEXT,
  event_description TEXT,
  event_date TIMESTAMPTZ,
  created_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  (
    -- Job updates
    SELECT
      ju.id,
      ju.update_type::TEXT,
      ju.title,
      ju.description,
      ju.created_at,
      p.full_name
    FROM job_updates ju
    LEFT JOIN profiles p ON ju.created_by = p.id
    WHERE ju.job_id = job_id_param
  )
  UNION ALL
  (
    -- Site diary entries
    SELECT
      sde.id,
      'diary_entry'::TEXT,
      'Site Diary: ' || TO_CHAR(sde.entry_date, 'DD/MM/YYYY'),
      sde.notes,
      sde.created_at,
      p.full_name
    FROM site_diary_entries sde
    LEFT JOIN profiles p ON sde.created_by = p.id
    WHERE sde.job_id = job_id_param
  )
  UNION ALL
  (
    -- Task completions
    SELECT
      t.id,
      'task_completed'::TEXT,
      'Task Completed: ' || t.title,
      t.description,
      t.completed_at,
      p.full_name
    FROM tasks t
    LEFT JOIN profiles p ON t.assigned_to = p.id
    WHERE t.job_id = job_id_param
      AND t.status = 'completed'
      AND t.completed_at IS NOT NULL
  )
  ORDER BY event_date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: get_dashboard_stats
-- Get key statistics for the main dashboard
-- ============================================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_role TEXT, user_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'active_jobs', (
      SELECT COUNT(*)
      FROM jobs
      WHERE status IN ('planning', 'in_progress')
        AND (
          user_role IN ('admin', 'site_manager')
          OR id IN (SELECT job_id FROM job_assignments WHERE worker_id = user_id)
          OR client_id = user_id
        )
    ),
    'overdue_tasks', (
      SELECT COUNT(*)
      FROM tasks
      WHERE status != 'completed'
        AND due_date < CURRENT_DATE
        AND (
          user_role IN ('admin', 'site_manager')
          OR assigned_to = user_id
          OR job_id IN (SELECT job_id FROM job_assignments WHERE worker_id = user_id)
        )
    ),
    'compliance_gaps', (
      SELECT COUNT(*)
      FROM compliance_logs
      WHERE status IN ('pending', 'flagged', 'expired')
        AND (
          user_role IN ('admin', 'site_manager')
          OR job_id IN (SELECT job_id FROM job_assignments WHERE worker_id = user_id)
        )
    ),
    'pending_tasks', (
      SELECT COUNT(*)
      FROM tasks
      WHERE status = 'pending'
        AND (
          user_role IN ('admin', 'site_manager')
          OR assigned_to = user_id
        )
    ),
    'total_workers', (
      SELECT COUNT(DISTINCT worker_id)
      FROM job_assignments
      WHERE user_role IN ('admin', 'site_manager')
    )
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
