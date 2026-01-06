import { Card, CardContent } from '@/components/ui/card';
import { FileText, Eye, Key, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  loading?: boolean;
}

function StatCard({ title, value, icon: Icon, loading }: StatCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
              </>
            )}
          </div>
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AnalyticsOverviewProps {
  totalPastes: number;
  totalViews: number;
  activeKeys: number;
  loading?: boolean;
}

export function AnalyticsOverview({ totalPastes, totalViews, activeKeys, loading }: AnalyticsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="Total Shares" value={totalPastes} icon={FileText} loading={loading} />
      <StatCard title="Total Views" value={totalViews} icon={Eye} loading={loading} />
      <StatCard title="Active Keys" value={activeKeys} icon={Key} loading={loading} />
      <StatCard title="Avg Views" value={totalPastes > 0 ? Math.round(totalViews / totalPastes) : 0} icon={Activity} loading={loading} />
    </div>
  );
}
