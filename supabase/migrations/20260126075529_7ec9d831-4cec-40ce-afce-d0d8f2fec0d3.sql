-- Add Clerk subscription ID to profiles for Clerk Billing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_subscription_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_subscription_id ON profiles(clerk_subscription_id);