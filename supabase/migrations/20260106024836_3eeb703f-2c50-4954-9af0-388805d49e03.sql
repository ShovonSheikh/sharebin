-- Create table for API rate limiting
CREATE TABLE public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(api_key_hash, window_start)
);

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_lookup ON public.api_rate_limits(api_key_hash, window_start);

-- Enable RLS
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role can manage rate limits"
ON public.api_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Add function to clean up old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;