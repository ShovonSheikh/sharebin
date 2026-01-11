-- Remove the overly permissive burn-after-read delete policy
-- The edge function uses service role and handles deletion properly
DROP POLICY IF EXISTS "Allow delete for burn_after_read pastes" ON public.shares;