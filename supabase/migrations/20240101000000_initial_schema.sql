-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  family_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  monthly_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  is_admin BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  stripe_invoice_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  receipt_url TEXT,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes
CREATE INDEX idx_families_user_id ON families(user_id);
CREATE INDEX idx_families_stripe_customer_id ON families(stripe_customer_id);
CREATE INDEX idx_families_subscription_status ON families(subscription_status);
CREATE INDEX idx_donations_family_id ON donations(family_id);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_status ON donations(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for families table
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for families table
CREATE POLICY "Users can view their own family"
  ON families FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family"
  ON families FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family"
  ON families FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all families"
  ON families FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policies for donations table
CREATE POLICY "Users can view their own donations"
  ON donations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = donations.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all donations"
  ON donations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "System can insert donations"
  ON donations FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "System can update donations"
  ON donations FOR UPDATE
  USING (TRUE);
