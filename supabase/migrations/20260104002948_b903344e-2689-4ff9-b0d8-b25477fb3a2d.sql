-- Add password protection and burn after read columns to shares table
ALTER TABLE public.shares 
ADD COLUMN password_hash TEXT,
ADD COLUMN burn_after_read BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster lookups
CREATE INDEX idx_shares_burn_after_read ON public.shares(burn_after_read) WHERE burn_after_read = true;