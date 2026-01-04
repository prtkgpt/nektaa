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
      families: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          family_name: string
          contact_email: string
          contact_phone: string | null
          monthly_amount: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
          is_admin: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          family_name: string
          contact_email: string
          contact_phone?: string | null
          monthly_amount: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          is_admin?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          family_name?: string
          contact_email?: string
          contact_phone?: string | null
          monthly_amount?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          is_admin?: boolean
        }
      }
      donations: {
        Row: {
          id: string
          created_at: string
          family_id: string
          amount: number
          stripe_payment_intent_id: string
          stripe_invoice_id: string | null
          status: 'pending' | 'succeeded' | 'failed'
          receipt_url: string | null
          period_start: string
          period_end: string
        }
        Insert: {
          id?: string
          created_at?: string
          family_id: string
          amount: number
          stripe_payment_intent_id: string
          stripe_invoice_id?: string | null
          status?: 'pending' | 'succeeded' | 'failed'
          receipt_url?: string | null
          period_start: string
          period_end: string
        }
        Update: {
          id?: string
          created_at?: string
          family_id?: string
          amount?: number
          stripe_payment_intent_id?: string
          stripe_invoice_id?: string | null
          status?: 'pending' | 'succeeded' | 'failed'
          receipt_url?: string | null
          period_start?: string
          period_end?: string
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
