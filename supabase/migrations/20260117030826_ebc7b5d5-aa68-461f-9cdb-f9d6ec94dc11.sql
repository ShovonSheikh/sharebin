-- Drop foreign key constraints first
ALTER TABLE shares DROP CONSTRAINT IF EXISTS shares_user_id_fkey;
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey;

-- Drop ALL RLS policies on shares (exact names from database)
DROP POLICY IF EXISTS "Anyone can view non-expired shares" ON shares;
DROP POLICY IF EXISTS "Anyone can create shares" ON shares;
DROP POLICY IF EXISTS "Users can update their own shares" ON shares;
DROP POLICY IF EXISTS "Users can delete their own shares" ON shares;

-- Drop ALL RLS policies on api_keys (exact names from database)
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;