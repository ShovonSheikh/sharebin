import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  totalPastes: number;
  totalViews: number;
  activeKeys: number;
  popularPastes: Array<{
    id: string;
    title: string | null;
    views: number;
    created_at: string;
  }>;
  viewsByDay: Array<{
    date: string;
    views: number;
  }>;
}

export function useAnalytics(userId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', userId],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!userId) {
        return {
          totalPastes: 0,
          totalViews: 0,
          activeKeys: 0,
          popularPastes: [],
          viewsByDay: [],
        };
      }

      // Fetch all user's shares
      const { data: shares } = await supabase
        .from('shares')
        .select('id, title, views, created_at')
        .eq('user_id', userId);

      // Fetch active API keys count
      const { count: activeKeys } = await supabase
        .from('api_keys')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      const allShares = shares || [];
      
      // Calculate totals
      const totalPastes = allShares.length;
      const totalViews = allShares.reduce((sum, s) => sum + (s.views || 0), 0);

      // Get popular pastes (top 5 by views)
      const popularPastes = [...allShares]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          title: p.title,
          views: p.views || 0,
          created_at: p.created_at,
        }));

      // Generate views by day (last 7 days)
      // Since we don't have daily view tracking, we'll simulate based on creation dates
      const last7Days: Array<{ date: string; views: number }> = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Count pastes created on this day and their views
        const dayViews = allShares
          .filter(s => s.created_at.startsWith(dateStr))
          .reduce((sum, s) => sum + (s.views || 0), 0);
        
        last7Days.push({
          date: dateStr,
          views: dayViews,
        });
      }

      return {
        totalPastes,
        totalViews,
        activeKeys: activeKeys || 0,
        popularPastes,
        viewsByDay: last7Days,
      };
    },
    enabled: !!userId,
    staleTime: 30000, // Cache for 30 seconds
  });
}
