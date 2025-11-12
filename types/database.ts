export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone_number: string | null;
          role: 'admin' | 'site_manager' | 'worker' | 'client';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone_number?: string | null;
          role: 'admin' | 'site_manager' | 'worker' | 'client';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone_number?: string | null;
          role?: 'admin' | 'site_manager' | 'worker' | 'client';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          site_name: string;
          client_name: string;
          client_id: string | null;
          description: string | null;
          address: string | null;
          start_date: string | null;
          end_date: string | null;
          estimated_completion: string | null;
          status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_name: string;
          client_name: string;
          client_id?: string | null;
          description?: string | null;
          address?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          estimated_completion?: string | null;
          status?: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_name?: string;
          client_name?: string;
          client_id?: string | null;
          description?: string | null;
          address?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          estimated_completion?: string | null;
          status?: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_assignments: {
        Row: {
          id: string;
          job_id: string;
          worker_id: string;
          role: string | null;
          assigned_at: string;
          assigned_by: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          worker_id: string;
          role?: string | null;
          assigned_at?: string;
          assigned_by?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          worker_id?: string;
          role?: string | null;
          assigned_at?: string;
          assigned_by?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          job_id: string;
          title: string;
          description: string | null;
          assigned_to: string | null;
          status: 'pending' | 'in_progress' | 'completed' | 'blocked';
          priority: 'low' | 'medium' | 'high' | 'urgent' | null;
          due_date: string | null;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          title?: string;
          description?: string | null;
          assigned_to?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_diary_entries: {
        Row: {
          id: string;
          job_id: string;
          entry_date: string;
          weather: string | null;
          workers_present: number | null;
          notes: string;
          issues: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          entry_date: string;
          weather?: string | null;
          workers_present?: number | null;
          notes: string;
          issues?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          entry_date?: string;
          weather?: string | null;
          workers_present?: number | null;
          notes?: string;
          issues?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      compliance_logs: {
        Row: {
          id: string;
          job_id: string;
          compliance_type: 'ppe' | 'cscs_card' | 'insurance' | 'site_access' | 'safety_inspection' | 'other';
          title: string;
          description: string | null;
          status: 'compliant' | 'pending' | 'flagged' | 'expired';
          due_date: string | null;
          verified_by: string | null;
          verified_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          compliance_type: 'ppe' | 'cscs_card' | 'insurance' | 'site_access' | 'safety_inspection' | 'other';
          title: string;
          description?: string | null;
          status?: 'compliant' | 'pending' | 'flagged' | 'expired';
          due_date?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          compliance_type?: 'ppe' | 'cscs_card' | 'insurance' | 'site_access' | 'safety_inspection' | 'other';
          title?: string;
          description?: string | null;
          status?: 'compliant' | 'pending' | 'flagged' | 'expired';
          due_date?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      compliance_items: {
        Row: {
          id: string;
          compliance_log_id: string;
          worker_id: string | null;
          item_name: string;
          status: 'completed' | 'pending' | 'flagged';
          notes: string | null;
          checked_by: string | null;
          checked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          compliance_log_id: string;
          worker_id?: string | null;
          item_name: string;
          status?: 'completed' | 'pending' | 'flagged';
          notes?: string | null;
          checked_by?: string | null;
          checked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          compliance_log_id?: string;
          worker_id?: string | null;
          item_name?: string;
          status?: 'completed' | 'pending' | 'flagged';
          notes?: string | null;
          checked_by?: string | null;
          checked_at?: string | null;
          created_at?: string;
        };
      };
      file_uploads: {
        Row: {
          id: string;
          file_name: string;
          file_path: string;
          file_type: string | null;
          file_size: number | null;
          uploaded_by: string;
          related_to_type: 'job' | 'task' | 'diary_entry' | 'compliance_log' | 'compliance_item' | 'profile' | null;
          related_to_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          file_path: string;
          file_type?: string | null;
          file_size?: number | null;
          uploaded_by: string;
          related_to_type?: 'job' | 'task' | 'diary_entry' | 'compliance_log' | 'compliance_item' | 'profile' | null;
          related_to_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          file_name?: string;
          file_path?: string;
          file_type?: string | null;
          file_size?: number | null;
          uploaded_by?: string;
          related_to_type?: 'job' | 'task' | 'diary_entry' | 'compliance_log' | 'compliance_item' | 'profile' | null;
          related_to_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      sms_alerts: {
        Row: {
          id: string;
          recipient_id: string | null;
          phone_number: string;
          message: string;
          alert_type: 'job_update' | 'safety_reminder' | 'compliance_alert' | 'task_assignment' | 'urgent' | null;
          related_to_type: 'job' | 'task' | 'compliance_log' | null;
          related_to_id: string | null;
          twilio_sid: string | null;
          status: 'sent' | 'delivered' | 'failed' | null;
          sent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id?: string | null;
          phone_number: string;
          message: string;
          alert_type?: 'job_update' | 'safety_reminder' | 'compliance_alert' | 'task_assignment' | 'urgent' | null;
          related_to_type?: 'job' | 'task' | 'compliance_log' | null;
          related_to_id?: string | null;
          twilio_sid?: string | null;
          status?: 'sent' | 'delivered' | 'failed' | null;
          sent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string | null;
          phone_number?: string;
          message?: string;
          alert_type?: 'job_update' | 'safety_reminder' | 'compliance_alert' | 'task_assignment' | 'urgent' | null;
          related_to_type?: 'job' | 'task' | 'compliance_log' | null;
          related_to_id?: string | null;
          twilio_sid?: string | null;
          status?: 'sent' | 'delivered' | 'failed' | null;
          sent_at?: string;
          created_at?: string;
        };
      };
      job_updates: {
        Row: {
          id: string;
          job_id: string;
          update_type: 'status_change' | 'task_completed' | 'photo_uploaded' | 'diary_entry' | 'compliance_update' | 'comment';
          title: string;
          description: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          update_type: 'status_change' | 'task_completed' | 'photo_uploaded' | 'diary_entry' | 'compliance_update' | 'comment';
          title: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          update_type?: 'status_change' | 'task_completed' | 'photo_uploaded' | 'diary_entry' | 'compliance_update' | 'comment';
          title?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
