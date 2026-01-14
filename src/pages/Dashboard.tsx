import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ApiKeyManager } from '@/components/dashboard/ApiKeyManager';
import { UserPastes } from '@/components/dashboard/UserPastes';
import { AnalyticsOverview } from '@/components/dashboard/AnalyticsOverview';
import { ViewsChart } from '@/components/dashboard/ViewsChart';
import { PopularPastes } from '@/components/dashboard/PopularPastes';
import { ImageGallery } from '@/components/dashboard/ImageGallery';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(user?.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back Button */}
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Link to="/">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Share
              </Button>
            </Link>
          </div>

          {/* Analytics Overview */}
          <AnalyticsOverview
            totalPastes={analytics?.totalPastes || 0}
            totalViews={analytics?.totalViews || 0}
            activeKeys={analytics?.activeKeys || 0}
            loading={analyticsLoading}
          />

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <ViewsChart 
              data={analytics?.viewsByDay || []} 
              loading={analyticsLoading} 
            />
            <PopularPastes 
              pastes={analytics?.popularPastes || []} 
              loading={analyticsLoading} 
            />
          </div>

          {/* Image Gallery */}
          <ImageGallery />

          {/* API Keys Section */}
          <ApiKeyManager />

          {/* Shares Section */}
          <UserPastes />
        </div>
      </div>
    </Layout>
  );
}
