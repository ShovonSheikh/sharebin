import { supabase } from '@/integrations/supabase/client';

/**
 * Update storage used for a user profile
 * @param clerkUserId - The Clerk user ID
 * @param sizeChange - Positive to increment, negative to decrement
 */
export async function updateStorageUsed(
  clerkUserId: string, 
  sizeChange: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, storage_used')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();
      
    if (fetchError) {
      console.error('Error fetching profile for storage update:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!profile) {
      console.warn('No profile found for Clerk user:', clerkUserId);
      return { success: false, error: 'Profile not found' };
    }
    
    const newStorageUsed = Math.max(0, (profile.storage_used || 0) + sizeChange);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ storage_used: newStorageUsed })
      .eq('id', profile.id);
      
    if (updateError) {
      console.error('Error updating storage used:', updateError);
      return { success: false, error: updateError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating storage:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Verify that a user owns a specific share
 * @param shareId - The share ID to verify
 * @param clerkUserId - The Clerk user ID
 * @returns Whether the user owns the share
 */
export async function verifyShareOwnership(
  shareId: string,
  clerkUserId: string
): Promise<{ owned: boolean; share?: { user_id: string | null; file_size: number | null } }> {
  const { data: share, error } = await supabase
    .from('shares')
    .select('user_id, file_size')
    .eq('id', shareId)
    .maybeSingle();
    
  if (error || !share) {
    return { owned: false };
  }
  
  return { 
    owned: share.user_id === clerkUserId, 
    share 
  };
}

/**
 * Verify that a user owns a specific API key
 * @param keyId - The API key ID to verify
 * @param clerkUserId - The Clerk user ID
 * @returns Whether the user owns the API key
 */
export async function verifyApiKeyOwnership(
  keyId: string,
  clerkUserId: string
): Promise<boolean> {
  const { data: key, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('id', keyId)
    .maybeSingle();
    
  if (error || !key) {
    return false;
  }
  
  return key.user_id === clerkUserId;
}
