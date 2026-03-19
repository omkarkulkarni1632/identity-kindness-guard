import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qiblxxqvrtokechaagbl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpYmx4eHF2cnRva2VjaGFhZ2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTkzNDUsImV4cCI6MjA4ODc5NTM0NX0.deXnaAPG6Pxsqfh-gvFMvp4yIAOnfYW2we_EfAig3Eo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          employee_id: string
          name: string
          email: string
          department_id: string | null
          role_template_id: string | null
          manager_id: string | null
          job_title: string
          jml_stage: 'joiner' | 'mover' | 'leaver' | 'active'
          status: 'active' | 'disabled' | 'pending' | 'offboarded'
          join_date: string
          exit_date: string | null
          risk_score: number
          risk_level: 'critical' | 'high' | 'medium' | 'low'
          temp_password: string | null
          credential_issued_at: string | null
          avatar_seed: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['employees']['Insert']>
      }
      permissions: {
        Row: {
          id: string
          employee_id: string
          system_id: string
          access_level: string
          granted_date: string
          last_used: string | null
          risk_level: 'critical' | 'high' | 'medium' | 'low'
          is_default: boolean
          is_active: boolean
          granted_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      systems: {
        Row: {
          id: string
          name: string
          description: string | null
          is_critical: boolean
          owner: string | null
          created_at: string
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
      }
      role_templates: {
        Row: {
          id: string
          name: string
          department_id: string | null
          description: string | null
          default_permissions: any[]
          created_at: string
        }
      }
      access_requests: {
        Row: {
          id: string
          request_number: string
          employee_id: string
          requested_by: string | null
          request_type: 'onboarding' | 'role_change' | 'access_grant' | 'access_revoke' | 'offboarding'
          status: 'pending' | 'approved' | 'rejected' | 'modified' | 'escalated'
          priority: string
          description: string | null
          requested_permissions: any | null
          reviewer_id: string | null
          reviewer_notes: string | null
          reviewed_at: string | null
          requires_dual_approval: boolean
          due_date: string | null
          created_at: string
          updated_at: string
        }
      }
      access_reviews: {
        Row: {
          id: string
          employee_id: string
          permission_id: string | null
          system_id: string | null
          access_level: string | null
          risk_level: 'critical' | 'high' | 'medium' | 'low'
          reviewer_id: string | null
          decision: 'pending' | 'approve' | 'reduce' | 'revoke'
          due_date: string
          completed_date: string | null
          ai_recommendation: string | null
          ai_confidence: number | null
          escalated: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          employee_id: string | null
          performed_by_id: string | null
          performed_by_name: string
          target_user_name: string | null
          details: string
          metadata: any | null
          system_name: string | null
          ip_address: string | null
          created_at: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          employee_id: string
          insight_type: string
          severity: string
          title: string
          description: string
          action_recommended: string | null
          is_resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          created_at: string
        }
      }
      platform_users: {
        Row: {
          id: string
          auth_user_id: string | null
          name: string
          email: string
          platform_role: 'CISO' | 'IT' | 'HR'
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
