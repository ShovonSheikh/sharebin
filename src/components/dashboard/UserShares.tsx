import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, Trash2, Clock, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/constants';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Share {
  id: string;
  title: string | null;
  content: string;
  syntax: string;
  created_at: string;
  expires_at: string | null;
  views: number;
}

export function UserShares() {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchShares();
    }
  }, [user]);

  const fetchShares = async () => {
    try {
      const { data, error } = await supabase
        .from('shares')
        .select('id, title, content, syntax, created_at, expires_at, views')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast.error('Failed to load shares');
    } finally {
      setLoading(false);
    }
  };

  const deleteShare = async (shareId: string) => {
    setDeleting(shareId);
    try {
      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      setShares(shares.filter(s => s.id !== shareId));
      toast.success('Share deleted');
    } catch (error) {
      console.error('Error deleting share:', error);
      toast.error('Failed to delete share');
    } finally {
      setDeleting(null);
    }
  };

  const getPreview = (content: string) => {
    const maxLength = 100;
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Your Shares
        </CardTitle>
        <CardDescription>
          Manage your created text shares.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading shares...
          </div>
        ) : shares.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shares yet.</p>
            <Link to="/">
              <Button variant="outline" className="mt-4">
                Create Your First Share
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-start justify-between p-4 bg-secondary rounded-lg gap-4"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">
                      {share.title || `Share ${share.id}`}
                    </span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {share.syntax}
                    </Badge>
                    {isExpired(share.expires_at) && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono truncate">
                    {getPreview(share.content)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {share.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(share.created_at)}
                    </span>
                    {share.expires_at && (
                      <span>
                        Expires: {formatDate(share.expires_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/s/${share.id}`}>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        disabled={deleting === share.id}
                      >
                        {deleting === share.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Share?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this share. Anyone with the link will no longer be able to access it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteShare(share.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}