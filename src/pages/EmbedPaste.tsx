import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/paste/CodeBlock';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, FileX, Lock, ExternalLink } from 'lucide-react';

interface Paste {
  id: string;
  content: string;
  title: string | null;
  syntax: string;
  password_hash: string | null;
}

export default function EmbedPaste() {
  const { id } = useParams<{ id: string }>();
  const [paste, setPaste] = useState<Paste | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPaste();
    }
  }, [id]);

  const fetchPaste = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shares')
        .select('id, content, title, syntax, password_hash, expires_at, burn_after_read')
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
        return;
      }

      // Don't allow embedding password-protected or burn-after-read shares
      if (data.password_hash) {
        setError('protected');
        return;
      }

      if (data.burn_after_read) {
        setError('Cannot embed burn-after-read pastes');
        return;
      }

      setPaste(data);
    } catch (err) {
      console.error('Error fetching paste:', err);
      setError('Failed to load paste');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error === 'protected') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center bg-card border-border max-w-sm">
          <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            This share is password protected.
          </p>
          <a
            href={`${window.location.origin}/p/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm mt-2 inline-flex items-center gap-1"
          >
            View on Pastely
            <ExternalLink className="h-3 w-3" />
          </a>
        </Card>
      </div>
    );
  }

  if (error || !paste) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center bg-card border-border max-w-sm">
          <FileX className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {error || 'Paste not found'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          {paste.title && (
            <span className="font-medium text-sm text-foreground truncate max-w-[200px]">
              {paste.title}
            </span>
          )}
          <Badge variant="secondary" className="font-mono text-xs">
            {paste.syntax}
          </Badge>
        </div>
        <a
          href={`${window.location.origin}/p/${paste.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          Pastely
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Content */}
      {paste.syntax === 'markdown' ? (
        <Card className="bg-[#282c34] border-[#3e4451] overflow-hidden">
          <div className="p-4 prose prose-invert prose-sm max-w-none overflow-auto max-h-[350px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {paste.content}
            </ReactMarkdown>
          </div>
        </Card>
      ) : (
        <CodeBlock
          content={paste.content}
          syntax={paste.syntax}
          showLineNumbers={true}
          maxHeight="350px"
        />
      )}
    </div>
  );
}
