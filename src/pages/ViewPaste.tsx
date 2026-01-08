import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PasteView } from '@/components/paste/PasteView';
import { PasswordModal } from '@/components/paste/PasswordModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { hashPassword, SUPABASE_FUNCTIONS_URL } from '@/lib/constants';
import { Loader2, FileX, Home, Flame } from 'lucide-react';
import { toast } from 'sonner';

interface Paste {
  id: string;
  content: string;
  title: string | null;
  syntax: string;
  expires_at: string | null;
  created_at: string;
  views: number;
  burn_after_read?: boolean;
  burned?: boolean;
}

interface ProtectedPasteMeta {
  id: string;
  title: string | null;
  syntax: string;
  expires_at: string | null;
  created_at: string;
  protected: boolean;
  burn_after_read?: boolean;
}

export default function ViewPaste() {
  const { id } = useParams<{ id: string }>();
  const [paste, setPaste] = useState<Paste | null>(null);
  const [protectedMeta, setProtectedMeta] = useState<ProtectedPasteMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      // Check session storage for already unlocked pastes
      const unlockedData = sessionStorage.getItem(`paste_${id}`);
      if (unlockedData) {
        try {
          setPaste(JSON.parse(unlockedData));
          setLoading(false);
          return;
        } catch {
          sessionStorage.removeItem(`paste_${id}`);
        }
      }
      fetchPaste();
    }
  }, [id]);

  const fetchPaste = async () => {
    try {
      // First try direct fetch for unprotected shares
      const { data, error: fetchError } = await supabase
        .from('shares')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Paste not found');
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This paste has expired');
        toast.error('This paste has expired');
        return;
      }

      // If password protected, show password modal
      if (data.password_hash) {
        setProtectedMeta({
          id: data.id,
          title: data.title,
          syntax: data.syntax,
          expires_at: data.expires_at,
          created_at: data.created_at,
          protected: true,
          burn_after_read: data.burn_after_read,
        });
        return;
      }

      // Handle burn after read
      if (data.burn_after_read) {
        // Delete the paste after fetching
        const { error: deleteError } = await supabase.from('shares').delete().eq('id', id);
        if (deleteError) {
          console.error('Failed to delete burn-after-read paste:', deleteError);
        }
        setPaste({ ...data, burned: true, views: 1 });
      } else {
        // Increment view count first, then set paste with updated count
        const newViews = (data.views || 0) + 1;
        await supabase
          .from('shares')
          .update({ views: newViews })
          .eq('id', id);
        setPaste({ ...data, views: newViews });
      }
    } catch (err) {
      console.error('Error fetching paste:', err);
      setError('Failed to load paste');
      toast.error('Failed to load paste. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/api-pastes?id=${id}&verify=true`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      // Store in session for subsequent access
      if (!data.burned) {
        sessionStorage.setItem(`paste_${id}`, JSON.stringify(data));
      }

      setPaste(data);
      setProtectedMeta(null);
      return true;
    } catch (err) {
      console.error('Error verifying password:', err);
      return false;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading paste...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show password modal for protected pastes
  if (protectedMeta) {
    return (
      <Layout>
        <PasswordModal
          title={protectedMeta.title}
          burnAfterRead={protectedMeta.burn_after_read}
          onSubmit={handlePasswordSubmit}
        />
      </Layout>
    );
  }

  if (error || !paste) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto p-8 text-center bg-card border-border">
            <FileX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Paste Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || 'This paste may have been deleted or expired.'}
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
          <PasteView paste={paste} />
        </div>
      </div>
    </Layout>
  );
}
