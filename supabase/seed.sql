-- SiteFlow Demo/Seed Data
-- This file contains sample data for testing and demo mode

-- Note: In a real setup, you would create actual auth users first
-- For demo purposes, we'll create profiles with fake UUIDs

-- ============================================================================
-- DEMO PROFILES
-- ============================================================================

-- Admin user
INSERT INTO profiles (id, email, full_name, phone_number, role, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@siteflow.app', 'Sarah Admin', '+447700900001', 'admin', NOW() - INTERVAL '90 days');

-- Site Managers
INSERT INTO profiles (id, email, full_name, phone_number, role, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'john.manager@siteflow.app', 'John Manager', '+447700900002', 'site_manager', NOW() - INTERVAL '60 days'),
  ('00000000-0000-0000-0000-000000000003', 'emma.supervisor@siteflow.app', 'Emma Supervisor', '+447700900003', 'site_manager', NOW() - INTERVAL '45 days');

-- Workers
INSERT INTO profiles (id, email, full_name, phone_number, role, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000004', 'mike.worker@siteflow.app', 'Mike Builder', '+447700900004', 'worker', NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0000-000000000005', 'jane.electrician@siteflow.app', 'Jane Electrician', '+447700900005', 'worker', NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0000-000000000006', 'tom.plumber@siteflow.app', 'Tom Plumber', '+447700900006', 'worker', NOW() - INTERVAL '25 days'),
  ('00000000-0000-0000-0000-000000000007', 'lisa.carpenter@siteflow.app', 'Lisa Carpenter', '+447700900007', 'worker', NOW() - INTERVAL '20 days');

-- Clients
INSERT INTO profiles (id, email, full_name, phone_number, role, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000008', 'client1@example.com', 'Robert Johnson', '+447700900008', 'client', NOW() - INTERVAL '60 days'),
  ('00000000-0000-0000-0000-000000000009', 'client2@example.com', 'Patricia Williams', '+447700900009', 'client', NOW() - INTERVAL '45 days');

-- ============================================================================
-- DEMO JOBS
-- ============================================================================

INSERT INTO jobs (id, site_name, client_name, client_id, description, address, start_date, end_date, estimated_completion, status, created_by, created_at)
VALUES
  -- Active job 1
  (
    '10000000-0000-0000-0000-000000000001',
    'Riverside Apartments - Building A',
    'Robert Johnson',
    '00000000-0000-0000-0000-000000000008',
    'New build residential development - 12 units',
    '123 River Road, London, E1 4TH',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '90 days',
    CURRENT_DATE + INTERVAL '85 days',
    'in_progress',
    '00000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '30 days'
  ),
  -- Active job 2
  (
    '10000000-0000-0000-0000-000000000002',
    'Oak Street Renovation',
    'Patricia Williams',
    '00000000-0000-0000-0000-000000000009',
    'Complete house renovation and extension',
    '456 Oak Street, Manchester, M1 2AB',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '55 days',
    'in_progress',
    '00000000-0000-0000-0000-000000000003',
    NOW() - INTERVAL '15 days'
  ),
  -- Planning job
  (
    '10000000-0000-0000-0000-000000000003',
    'Greenfield Industrial Park',
    'ABC Construction Ltd',
    NULL,
    'New industrial warehouse complex',
    '789 Green Lane, Birmingham, B2 3CD',
    CURRENT_DATE + INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '180 days',
    CURRENT_DATE + INTERVAL '175 days',
    'planning',
    '00000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '5 days'
  ),
  -- Completed job
  (
    '10000000-0000-0000-0000-000000000004',
    'High Street Shop Fit-out',
    'XYZ Retail Group',
    NULL,
    'Shop renovation and modernization',
    '321 High Street, Bristol, BS1 4EF',
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE - INTERVAL '10 days',
    'completed',
    '00000000-0000-0000-0000-000000000003',
    NOW() - INTERVAL '60 days'
  );

-- ============================================================================
-- JOB ASSIGNMENTS
-- ============================================================================

-- Riverside Apartments assignments
INSERT INTO job_assignments (job_id, worker_id, role, assigned_by, assigned_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Site Foreman', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '28 days'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Electrician', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '25 days'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Plumber', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '25 days');

-- Oak Street assignments
INSERT INTO job_assignments (job_id, worker_id, role, assigned_by, assigned_at)
VALUES
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'Carpenter', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '14 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'Electrician', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '12 days');

-- ============================================================================
-- TASKS
-- ============================================================================

-- Riverside Apartments tasks
INSERT INTO tasks (job_id, title, description, assigned_to, status, priority, due_date, created_by, created_at, completed_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Foundation inspection', 'Verify foundation work meets specifications', '00000000-0000-0000-0000-000000000004', 'completed', 'high', CURRENT_DATE - INTERVAL '20 days', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '25 days', NOW() - INTERVAL '18 days'),
  ('10000000-0000-0000-0000-000000000001', 'First fix electrics - Units 1-6', 'Complete first fix electrical work', '00000000-0000-0000-0000-000000000005', 'in_progress', 'high', CURRENT_DATE + INTERVAL '5 days', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '15 days', NULL),
  ('10000000-0000-0000-0000-000000000001', 'Plumbing rough-in - Units 1-4', 'Install all plumbing rough-in', '00000000-0000-0000-0000-000000000006', 'in_progress', 'medium', CURRENT_DATE + INTERVAL '7 days', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '10 days', NULL),
  ('10000000-0000-0000-0000-000000000001', 'Safety barrier installation', 'Install safety barriers on balconies', '00000000-0000-0000-0000-000000000004', 'pending', 'urgent', CURRENT_DATE - INTERVAL '2 days', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '5 days', NULL),
  ('10000000-0000-0000-0000-000000000001', 'Window installation - Units 7-12', 'Install all windows and frames', '00000000-0000-0000-0000-000000000004', 'pending', 'medium', CURRENT_DATE + INTERVAL '14 days', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '3 days', NULL);

-- Oak Street tasks
INSERT INTO tasks (job_id, title, description, assigned_to, status, priority, due_date, created_by, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000002', 'Kitchen cabinets installation', 'Install all kitchen cabinetry', '00000000-0000-0000-0000-000000000007', 'in_progress', 'high', CURRENT_DATE + INTERVAL '10 days', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '8 days'),
  ('10000000-0000-0000-0000-000000000002', 'Rewire entire property', 'Complete electrical rewiring', '00000000-0000-0000-0000-000000000005', 'in_progress', 'high', CURRENT_DATE + INTERVAL '15 days', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '12 days'),
  ('10000000-0000-0000-0000-000000000002', 'Extension groundwork', 'Prepare foundation for extension', NULL, 'pending', 'urgent', CURRENT_DATE + INTERVAL '3 days', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '2 days');

-- ============================================================================
-- SITE DIARY ENTRIES
-- ============================================================================

INSERT INTO site_diary_entries (job_id, entry_date, weather, workers_present, notes, issues, created_by, created_at)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '2 days',
    'Sunny, 18°C',
    8,
    'Good progress on electrical first fix. Units 1-3 completed. Plumbing team started rough-in work on ground floor.',
    'Minor delay due to late material delivery (electrical conduit)',
    '00000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '2 days'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '1 day',
    'Cloudy, 15°C',
    7,
    'Continued electrical work. Safety inspection passed. Started window frame preparation for Units 7-9.',
    NULL,
    '00000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '1 day'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '1 day',
    'Rainy, 12°C',
    4,
    'Indoor work only due to weather. Carpentry team made excellent progress on kitchen units. Electrician completed upstairs rewiring.',
    'Weather delayed external groundwork for extension',
    '00000000-0000-0000-0000-000000000003',
    NOW() - INTERVAL '1 day'
  );

-- ============================================================================
-- COMPLIANCE LOGS
-- ============================================================================

INSERT INTO compliance_logs (job_id, compliance_type, title, description, status, due_date, created_by, created_at)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'ppe',
    'PPE Verification - Week 5',
    'Weekly PPE check for all workers on site',
    'compliant',
    CURRENT_DATE - INTERVAL '1 day',
    '00000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '3 days'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    'cscs_card',
    'CSCS Card Verification',
    'Verify all workers have valid CSCS cards',
    'flagged',
    CURRENT_DATE + INTERVAL '7 days',
    '00000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '5 days'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    'safety_inspection',
    'Monthly Safety Inspection',
    'Comprehensive site safety audit',
    'pending',
    CURRENT_DATE + INTERVAL '5 days',
    '00000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '2 days'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'insurance',
    'Public Liability Insurance',
    'Verify current insurance coverage',
    'compliant',
    CURRENT_DATE + INTERVAL '60 days',
    '00000000-0000-0000-0000-000000000003',
    NOW() - INTERVAL '10 days'
  );

-- ============================================================================
-- COMPLIANCE ITEMS
-- ============================================================================

-- Items for PPE verification (compliant)
INSERT INTO compliance_items (compliance_log_id, worker_id, item_name, status, checked_by, checked_at, created_at)
VALUES
  ((SELECT id FROM compliance_logs WHERE title = 'PPE Verification - Week 5'), '00000000-0000-0000-0000-000000000004', 'Hard hat', 'completed', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  ((SELECT id FROM compliance_logs WHERE title = 'PPE Verification - Week 5'), '00000000-0000-0000-0000-000000000004', 'Safety boots', 'completed', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  ((SELECT id FROM compliance_logs WHERE title = 'PPE Verification - Week 5'), '00000000-0000-0000-0000-000000000004', 'Hi-vis vest', 'completed', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days');

-- Items for CSCS Card verification (flagged)
INSERT INTO compliance_items (compliance_log_id, worker_id, item_name, status, notes, checked_by, checked_at, created_at)
VALUES
  ((SELECT id FROM compliance_logs WHERE title = 'CSCS Card Verification'), '00000000-0000-0000-0000-000000000005', 'CSCS Card - Jane Electrician', 'completed', 'Valid until 2026', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days'),
  ((SELECT id FROM compliance_logs WHERE title = 'CSCS Card Verification'), '00000000-0000-0000-0000-000000000006', 'CSCS Card - Tom Plumber', 'flagged', 'Card expires in 2 weeks - renewal needed', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days');

-- ============================================================================
-- JOB UPDATES
-- ============================================================================

INSERT INTO job_updates (job_id, update_type, title, description, created_by, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'status_change', 'Job started', 'Construction work commenced on site', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '30 days'),
  ('10000000-0000-0000-0000-000000000001', 'task_completed', 'Foundation inspection completed', 'Foundation work verified and approved', '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '18 days'),
  ('10000000-0000-0000-0000-000000000001', 'compliance_update', 'PPE check completed', 'All workers passed PPE verification', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day'),
  ('10000000-0000-0000-0000-000000000002', 'status_change', 'Renovation work started', 'Site mobilization complete, work underway', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '15 days'),
  ('10000000-0000-0000-0000-000000000002', 'comment', 'Weather delay', 'External work postponed due to heavy rain', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 day');

-- ============================================================================
-- SMS ALERTS (sample log)
-- ============================================================================

INSERT INTO sms_alerts (recipient_id, phone_number, message, alert_type, related_to_type, related_to_id, status, sent_at, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000006',
    '+447700900006',
    'Reminder: Your CSCS card expires in 2 weeks. Please arrange renewal. - SiteFlow',
    'compliance_alert',
    'compliance_log',
    (SELECT id FROM compliance_logs WHERE title = 'CSCS Card Verification'),
    'delivered',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '+447700900004',
    'Urgent: Safety barrier installation task is overdue. Please update status. - SiteFlow',
    'task_assignment',
    'task',
    (SELECT id FROM tasks WHERE title = 'Safety barrier installation'),
    'delivered',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  );
