import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function RawPaste() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<string>('');
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
        .select('content, expires_at, password_hash, burn_after_read')
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

      // Don't show raw for password protected or burn-after-read pastes
      if (data.password_hash) {
        setError('This paste is password protected');
        return;
      }

      if (data.burn_after_read) {
        setError('Raw view not available for burn-after-read pastes');
        return;
      }

      setContent(data.content);
    } catch (err) {
      console.error('Error fetching paste:', err);
      setError('Failed to load paste');
    } finally {
      setLoading(false);
    }
  };

  // Return plain text response
  useEffect(() => {
    if (!loading && !error && content) {
      // Set content type to plain text
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.background = '#0a0a0f';
    }
  }, [loading, error, content]);

  if (loading) {
    return (
      <pre style={{ 
        fontFamily: 'monospace', 
        padding: '1rem', 
        margin: 0,
        background: '#0a0a0f',
        color: '#888',
        minHeight: '100vh'
      }}>
        Loading...
      </pre>
    );
  }

  if (error) {
    return (
      <pre style={{ 
        fontFamily: 'monospace', 
        padding: '1rem', 
        margin: 0,
        background: '#0a0a0f',
        color: '#f87171',
        minHeight: '100vh'
      }}>
        {error}
      </pre>
    );
  }

  return (
    <pre style={{ 
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace', 
      padding: '1rem', 
      margin: 0,
      background: '#0a0a0f',
      color: '#e2e8f0',
      minHeight: '100vh',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      lineHeight: '1.5',
      fontSize: '14px'
    }}>
      {content}
    </pre>
  );
}
