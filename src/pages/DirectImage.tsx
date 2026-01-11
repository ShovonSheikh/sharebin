import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function DirectImage() {
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      redirectToImage();
    }
  }, [id]);

  const redirectToImage = async () => {
    try {
      // Fetch the share record to get file path
      const { data, error: fetchError } = await supabase
        .from('shares')
        .select('file_path, content_type, expires_at, password_hash')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Image not found');
        return;
      }

      // Check if it's actually an image
      if (data.content_type !== 'image') {
        setError('This is not an image');
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This image has expired');
        return;
      }

      // Check if password protected
      if (data.password_hash) {
        setError('This image is password protected. View it on the full page.');
        return;
      }

      if (!data.file_path) {
        setError('No image file found');
        return;
      }

      // Get public URL and redirect
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.file_path);

      if (urlData.publicUrl) {
        window.location.replace(urlData.publicUrl);
      } else {
        setError('Failed to get image URL');
      }
    } catch (err) {
      console.error('Error fetching image:', err);
      setError('Failed to load image');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <p className="text-muted-foreground">{error}</p>
          <a 
            href={`/p/${id}`} 
            className="text-primary hover:underline mt-2 block"
          >
            View full page
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
