import { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Job = Database['public']['Tables']['jobs']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type SiteDiaryEntry = Database['public']['Tables']['site_diary_entries']['Row'];
export type ComplianceLog = Database['public']['Tables']['compliance_logs']['Row'];
export type ComplianceItem = Database['public']['Tables']['compliance_items']['Row'];
export type FileUpload = Database['public']['Tables']['file_uploads']['Row'];
export type SmsAlert = Database['public']['Tables']['sms_alerts']['Row'];
export type JobUpdate = Database['public']['Tables']['job_updates']['Row'];
export type JobAssignment = Database['public']['Tables']['job_assignments']['Row'];

export type UserRole = Profile['role'];

export type JobStatus = Job['status'];
export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];
export type ComplianceStatus = ComplianceLog['status'];
export type ComplianceType = ComplianceLog['compliance_type'];

// Extended types with relations
export interface JobWithDetails extends Job {
  profiles?: Profile | null;
  total_tasks?: number;
  completed_tasks?: number;
  completion_percentage?: number;
  assigned_workers?: number;
  overdue_tasks?: number;
}

export interface TaskWithDetails extends Task {
  jobs?: Job | null;
  assignee?: Profile | null;
}

export interface ComplianceLogWithDetails extends ComplianceLog {
  jobs?: Job | null;
  compliance_items?: ComplianceItem[];
}

export interface DashboardStats {
  active_jobs: number;
  overdue_tasks: number;
  compliance_gaps: number;
  pending_tasks: number;
  total_workers?: number;
}
