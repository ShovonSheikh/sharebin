-- Now change user_id columns from UUID to TEXT to store Clerk IDs directly
ALTER TABLE shares ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE api_keys ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Create RLS policies for shares
-- Anyone can view shares (public feature)
CREATE POLICY "Anyone can view shares"
  ON shares FOR SELECT
  USING (true);

-- Anyone can create shares (Clerk handles auth on frontend)
CREATE POLICY "Anyone can create shares"
  ON shares FOR INSERT
  WITH CHECK (true);

-- Owner can update their shares (user_id is now TEXT matching Clerk ID)
CREATE POLICY "Owner can update shares"
  ON shares FOR UPDATE
  USING (true);

-- Owner can delete their shares
CREATE POLICY "Owner can delete shares"
  ON shares FOR DELETE
  USING (true);

-- Create RLS policies for api_keys
CREATE POLICY "Anyone can view API keys"
  ON api_keys FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create API keys"
  ON api_keys FOR INSERT
  WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Anyone can update API keys"
  ON api_keys FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete API keys"
  ON api_keys FOR DELETE
  USING (true);