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

interface Paste {
  id: string;
  title: string | null;
  content: string;
  syntax: string;
  created_at: string;
  expires_at: string | null;
  views: number;
}

export function UserPastes() {
  const [pastes, setPastes] = useState<Paste[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPastes();
    }
  }, [user]);

  const fetchPastes = async () => {
    try {
      const { data, error } = await supabase
        .from('shares')
        .select('id, title, content, syntax, created_at, expires_at, views')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPastes(data || []);
    } catch (error) {
      console.error('Error fetching pastes:', error);
      toast.error('Failed to load pastes');
    } finally {
      setLoading(false);
    }
  };

  const deletePaste = async (pasteId: string) => {
    setDeleting(pasteId);
    try {
      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('id', pasteId);

      if (error) throw error;

      setPastes(pastes.filter(p => p.id !== pasteId));
      toast.success('Paste deleted');
    } catch (error) {
      console.error('Error deleting paste:', error);
      toast.error('Failed to delete paste');
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
          Your Pastes
        </CardTitle>
        <CardDescription>
          Manage your created text pastes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading pastes...
          </div>
        ) : pastes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pastes yet.</p>
            <Link to="/">
              <Button variant="outline" className="mt-4">
                Create Your First Paste
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pastes.map((paste) => (
              <div
                key={paste.id}
                className="flex items-start justify-between p-4 bg-secondary rounded-lg gap-4"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">
                      {paste.title || `Paste ${paste.id}`}
                    </span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {paste.syntax}
                    </Badge>
                    {isExpired(paste.expires_at) && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono truncate">
                    {getPreview(paste.content)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {paste.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(paste.created_at)}
                    </span>
                    {paste.expires_at && (
                      <span>
                        Expires: {formatDate(paste.expires_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/p/${paste.id}`}>
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
                        disabled={deleting === paste.id}
                      >
                        {deleting === paste.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Paste?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this paste. Anyone with the link will no longer be able to access it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePaste(paste.id)}>
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