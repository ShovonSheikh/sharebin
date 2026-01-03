import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ShareView } from '@/components/share/ShareView';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileX, Home } from 'lucide-react';

interface Share {
  id: string;
  content: string;
  title: string | null;
  syntax: string;
  expires_at: string | null;
  created_at: string;
  views: number;
}

export default function ViewShare() {
  const { id } = useParams<{ id: string }>();
  const [share, setShare] = useState<Share | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchShare();
    }
  }, [id]);

  const fetchShare = async () => {
    try {
      // Fetch the share
      const { data, error: fetchError } = await supabase
        .from('shares')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Share not found');
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This share has expired');
        return;
      }

      setShare(data);

      // Increment view count
      await supabase
        .from('shares')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id);

    } catch (err) {
      console.error('Error fetching share:', err);
      setError('Failed to load share');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading share...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !share) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto p-8 text-center bg-card border-border">
            <FileX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Share Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || 'This share may have been deleted or expired.'}
            </p>
            <Link to="/">
              <Button className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <ShareView share={share} />
        </div>
      </div>
    </Layout>
  );
}