export interface Family {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  family_name: string
  contact_email: string
  contact_phone?: string
  monthly_amount: number
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  is_admin: boolean
}

export interface Donation {
  id: string
  created_at: string
  family_id: string
  amount: number
  stripe_payment_intent_id: string
  stripe_invoice_id?: string
  status: 'pending' | 'succeeded' | 'failed'
  receipt_url?: string
  period_start: string
  period_end: string
}
