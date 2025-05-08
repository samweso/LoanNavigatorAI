export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      calls: {
        Row: {
          id: string
          created_at: string
          title: string
          client_name: string
          audio_url: string
          duration: number
          status: string
          transcript?: string | null
          summary?: string | null
          action_items?: string[] | null
          key_points?: string[] | null
          loan_info?: Json | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          client_name: string
          audio_url: string
          duration: number
          status: string
          transcript?: string | null
          summary?: string | null
          action_items?: string[] | null
          key_points?: string[] | null
          loan_info?: Json | null
          user_id?: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          client_name?: string
          audio_url?: string
          duration?: number
          status?: string
          transcript?: string | null
          summary?: string | null
          action_items?: string[] | null
          key_points?: string[] | null
          loan_info?: Json | null
          user_id?: string
        }
      }
      loan_applications: {
        Row: {
          id: string
          created_at: string
          client_name: string
          client_email?: string | null
          client_phone?: string | null
          loan_amount: number
          loan_type: string
          property_type: string
          interest_rate: number
          term: number
          call_id?: string | null
          status: string
          user_id: string
          encompass_id?: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          client_name: string
          client_email?: string | null
          client_phone?: string | null
          loan_amount: number
          loan_type: string
          property_type: string
          interest_rate: number
          term: number
          call_id?: string | null
          status: string
          user_id?: string
          encompass_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          client_name?: string
          client_email?: string | null
          client_phone?: string | null
          loan_amount?: number
          loan_type?: string
          property_type?: string
          interest_rate?: number
          term?: number
          call_id?: string | null
          status?: string
          user_id?: string
          encompass_id?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          plan_id: string
          status: string
          updated_at?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          plan_id: string
          status: string
          updated_at?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          plan_id?: string
          status?: string
          updated_at?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}