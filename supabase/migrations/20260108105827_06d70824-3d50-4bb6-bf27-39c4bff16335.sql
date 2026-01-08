-- Add RLS policy to allow anyone to delete burn-after-read pastes
CREATE POLICY "Allow delete for burn_after_read pastes" 
ON public.shares 
FOR DELETE 
USING (burn_after_read = true);