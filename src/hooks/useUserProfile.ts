import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { SubscriptionTier } from '@/lib/tierLimits';

export interface UserProfile {
  id: string;
  clerk_user_id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  subscription_tier: SubscriptionTier;
  storage_used: number;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { user, loading } = useAuth();

  const query = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (!data) {
        // Profile doesn't exist yet (webhook hasn't processed)
        // Return default free tier profile
        return {
          id: '',
          clerk_user_id: user.id,
          email: user.email || null,
          first_name: null,
          last_name: null,
          image_url: null,
          subscription_tier: 'free' as SubscriptionTier,
          storage_used: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return {
        ...data,
        subscription_tier: (data.subscription_tier as SubscriptionTier) || 'free',
        storage_used: data.storage_used || 0,
      };
    },
    enabled: !loading && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    profile: query.data,
    isLoading: loading || query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
