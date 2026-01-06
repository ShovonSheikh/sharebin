import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PopularPaste {
  id: string;
  title: string | null;
  views: number;
  created_at: string;
}

interface PopularPastesProps {
  pastes: PopularPaste[];
  loading?: boolean;
}

export function PopularPastes({ pastes, loading }: PopularPastesProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Most Viewed Shares</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : pastes.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No shares yet. Create your first share!
          </p>
        ) : (
          <div className="space-y-3">
            {pastes.map((paste, index) => (
              <Link
                key={paste.id}
                to={`/p/${paste.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground w-5">
                    #{index + 1}
                  </span>
                  <span className="font-medium truncate">
                    {paste.title || paste.id}
                  </span>
                </div>
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Eye className="h-3 w-3" />
                  {paste.views}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
