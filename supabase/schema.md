# SiteFlow Database Schema

This document outlines the complete database schema for SiteFlow, a construction site management application.

## Overview

The schema is designed to support:
- Multi-role user management (Admin, Site Manager, Worker, Client)
- Job tracking with timelines and assignments
- Daily site diary entries
- Compliance logging and verification
- File uploads (photos, documents)
- SMS notification tracking
- Client portal access

## Tables

### 1. profiles
Extended user profile information linked to Supabase Auth.

**Columns:**
- `id` (uuid, PK): References auth.users(id)
- `email` (text, not null)
- `full_name` (text)
- `phone_number` (text)
- `role` (text, not null): 'admin' | 'site_manager' | 'worker' | 'client'
- `avatar_url` (text): Profile picture URL
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- Primary key on `id`
- Index on `email`
- Index on `role`

### 2. jobs
Core table for tracking construction jobs/projects.

**Columns:**
- `id` (uuid, PK)
- `site_name` (text, not null): Name of the construction site
- `client_name` (text, not null): Client/customer name
- `client_id` (uuid): References profiles(id) for client portal access
- `description` (text): Job description
- `address` (text): Site address
- `start_date` (date)
- `end_date` (date)
- `estimated_completion` (date)
- `status` (text, not null): 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
- `created_by` (uuid, references profiles)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- Primary key on `id`
- Index on `status`
- Index on `client_id`
- Index on `created_by`

### 3. job_assignments
Many-to-many relationship between jobs and workers.

**Columns:**
- `id` (uuid, PK)
- `job_id` (uuid, not null, references jobs)
- `worker_id` (uuid, not null, references profiles)
- `role` (text): Worker role on this job (e.g., 'foreman', 'laborer', 'electrician')
- `assigned_at` (timestamptz)
- `assigned_by` (uuid, references profiles)

**Indexes:**
- Primary key on `id`
- Index on `job_id`
- Index on `worker_id`
- Unique constraint on (`job_id`, `worker_id`)

### 4. tasks
Individual tasks within a job.

**Columns:**
- `id` (uuid, PK)
- `job_id` (uuid, not null, references jobs)
- `title` (text, not null)
- `description` (text)
- `assigned_to` (uuid, references profiles)
- `status` (text, not null): 'pending' | 'in_progress' | 'completed' | 'blocked'
- `priority` (text): 'low' | 'medium' | 'high' | 'urgent'
- `due_date` (date)
- `completed_at` (timestamptz)
- `created_by` (uuid, references profiles)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- Primary key on `id`
- Index on `job_id`
- Index on `assigned_to`
- Index on `status`

### 5. site_diary_entries
Daily log entries for site managers.

**Columns:**
- `id` (uuid, PK)
- `job_id` (uuid, not null, references jobs)
- `entry_date` (date, not null)
- `weather` (text): Weather conditions
- `workers_present` (integer): Number of workers on site
- `notes` (text, not null): Main diary entry (supports voice-to-text)
- `issues` (text): Any problems or concerns
- `created_by` (uuid, not null, references profiles)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- Primary key on `id`
- Index on `job_id`
- Index on `entry_date`
- Index on `created_by`

### 6. compliance_logs
High-level compliance tracking per job.

**Columns:**
- `id` (uuid, PK)
- `job_id` (uuid, not null, references jobs)
- `compliance_type` (text, not null): 'ppe' | 'cscs_card' | 'insurance' | 'site_access' | 'safety_inspection' | 'other'
- `title` (text, not null)
- `description` (text)
- `status` (text, not null): 'compliant' | 'pending' | 'flagged' | 'expired'
- `due_date` (date)
- `verified_by` (uuid, references profiles)
- `verified_at` (timestamptz)
- `created_by` (uuid, references profiles)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- Primary key on `id`
- Index on `job_id`
- Index on `compliance_type`
- Index on `status`

### 7. compliance_items
Individual checklist items within a compliance log.

**Columns:**
- `id` (uuid, PK)
- `compliance_log_id` (uuid, not null, references compliance_logs)
- `worker_id` (uuid, references profiles): Worker this item relates to
- `item_name` (text, not null): e.g., "Hard hat verification"
- `status` (text, not null): 'completed' | 'pending' | 'flagged'
- `notes` (text)
- `checked_by` (uuid, references profiles)
- `checked_at` (timestamptz)
- `created_at` (timestamptz)

**Indexes:**
- Primary key on `id`
- Index on `compliance_log_id`
- Index on `worker_id`

### 8. file_uploads
Storage metadata for all uploaded files (photos, documents, certificates).

**Columns:**
- `id` (uuid, PK)
- `file_name` (text, not null)
- `file_path` (text, not null): Path in Supabase Storage
- `file_type` (text): MIME type
- `file_size` (bigint): Size in bytes
- `uploaded_by` (uuid, not null, references profiles)
- `related_to_type` (text): 'job' | 'task' | 'diary_entry' | 'compliance_log' | 'compliance_item' | 'profile'
- `related_to_id` (uuid): ID of related entity
- `description` (text): Optional description
- `created_at` (timestamptz)

**Indexes:**
- Primary key on `id`
- Index on `uploaded_by`
- Index on `related_to_type`
- Index on `related_to_id`

### 9. sms_alerts
Log of all SMS notifications sent via Twilio.

**Columns:**
- `id` (uuid, PK)
- `recipient_id` (uuid, references profiles)
- `phone_number` (text, not null)
- `message` (text, not null)
- `alert_type` (text): 'job_update' | 'safety_reminder' | 'compliance_alert' | 'task_assignment' | 'urgent'
- `related_to_type` (text): 'job' | 'task' | 'compliance_log'
- `related_to_id` (uuid)
- `twilio_sid` (text): Twilio message SID
- `status` (text): 'sent' | 'delivered' | 'failed'
- `sent_at` (timestamptz)
- `created_at` (timestamptz)

**Indexes:**
- Primary key on `id`
- Index on `recipient_id`
- Index on `alert_type`
- Index on `status`

### 10. job_updates
Timeline of all updates/events for a job.

**Columns:**
- `id` (uuid, PK)
- `job_id` (uuid, not null, references jobs)
- `update_type` (text, not null): 'status_change' | 'task_completed' | 'photo_uploaded' | 'diary_entry' | 'compliance_update' | 'comment'
- `title` (text, not null)
- `description` (text)
- `created_by` (uuid, not null, references profiles)
- `created_at` (timestamptz)

**Indexes:**
- Primary key on `id`
- Index on `job_id`
- Index on `update_type`
- Index on `created_at` (descending)

## Row Level Security (RLS) Policies

All tables will have RLS enabled with the following policy structure:

### Admin Role
- Full access to all tables

### Site Manager Role
- Can create and manage jobs
- Can create diary entries and compliance logs
- Can assign workers to jobs
- Can view all data for jobs they created

### Worker Role
- Can view jobs they're assigned to
- Can view and update their assigned tasks
- Can view diary entries for their jobs
- Read-only access to compliance logs

### Client Role
- Read-only access to their assigned jobs
- Can view job updates, photos, and compliance status
- Cannot see worker details or sensitive information

## Storage Buckets

### job-photos
- Public read access for authenticated users
- Upload restricted to authenticated users with proper job access
- Max file size: 10MB
- Allowed types: image/*

### compliance-documents
- Private access, restricted by RLS
- Upload restricted to site managers and admins
- Max file size: 20MB
- Allowed types: image/*, application/pdf

### profile-avatars
- Public read access
- Upload restricted to profile owner
- Max file size: 2MB
- Allowed types: image/*

## Functions & Triggers

### 1. handle_new_user()
Trigger function to create a profile entry when a new user signs up.

### 2. update_updated_at()
Trigger function to automatically update the `updated_at` timestamp.

### 3. create_job_update()
Trigger function to automatically create job updates when certain events occur.

### 4. calculate_job_completion()
Function to calculate job completion percentage based on completed tasks.

## Views

### v_job_dashboard
Aggregated view of jobs with completion stats, compliance status, and recent updates.

### v_compliance_summary
Summary of compliance status by job and type.

### v_worker_assignments
View of all worker assignments with job details.
