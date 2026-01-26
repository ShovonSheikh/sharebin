import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatFileSize } from '@/lib/fileUtils';
import { updateStorageUsed, verifyShareOwnership } from '@/lib/storageUtils';
import { toast } from 'sonner';
import { Image, Eye, Lock, Flame, ExternalLink, ChevronRight, Trash2, Loader2 } from 'lucide-react';
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

interface ImageShare {
  id: string;
  title: string | null;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  views: number;
  created_at: string;
  password_hash: string | null;
  burn_after_read: boolean;
}

export function ImageGallery() {
  const { user } = useAuth();
  const [images, setImages] = useState<ImageShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchImages();
    }
  }, [user]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('shares')
        .select('id, title, file_name, file_path, file_size, views, created_at, password_hash, burn_after_read')
        .eq('user_id', user?.id)
        .eq('content_type', 'image')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;

      setImages(data || []);

      // Fetch public URLs for images
      const urls: Record<string, string> = {};
      for (const img of data || []) {
        if (img.file_path && !img.password_hash) {
          const { data: urlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(img.file_path);
          urls[img.id] = urlData.publicUrl;
        }
      }
      setImageUrls(urls);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user?.id) return;
    
    setDeleting(imageId);
    try {
      // Verify ownership before deleting
      const { owned, share } = await verifyShareOwnership(imageId, user.id);
      
      if (!owned) {
        toast.error('You do not have permission to delete this image');
        return;
      }

      // Find the image to get its file path
      const image = images.find(img => img.id === imageId);
      
      // Delete from storage if file path exists
      if (image?.file_path) {
        await supabase.storage.from('uploads').remove([image.file_path]);
      }

      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      // Decrement storage used if file had a size
      if (share?.file_size && share.file_size > 0) {
        await updateStorageUsed(user.id, -share.file_size);
      }

      setImages(images.filter(img => img.id !== imageId));
      toast.success('Image deleted');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Image Gallery
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Image Gallery
          </h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No images uploaded yet</p>
          <p className="text-sm mt-1">Upload images to see them here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          Image Gallery
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-1">
            Upload New
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative aspect-square rounded-lg overflow-hidden bg-secondary border border-border hover:border-primary/50 transition-all"
          >
            <Link to={`/p/${image.id}`} className="block w-full h-full">
              {/* Thumbnail */}
              {imageUrls[image.id] ? (
                <img
                  src={imageUrls[image.id]}
                  alt={image.title || image.file_name || 'Image'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  {image.password_hash ? (
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Overlay with info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium truncate">
                    {image.title || image.file_name || 'Untitled'}
                  </p>
                  <div className="flex items-center gap-2 text-white/70 text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {image.views}
                    </span>
                    {image.file_size && (
                      <span>{formatFileSize(image.file_size)}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            {/* Status badges */}
            <div className="absolute top-2 right-2 flex gap-1">
              {image.password_hash && (
                <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center bg-black/50">
                  <Lock className="h-3 w-3 text-yellow-500" />
                </Badge>
              )}
              {image.burn_after_read && (
                <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center bg-black/50">
                  <Flame className="h-3 w-3 text-orange-500" />
                </Badge>
              )}
            </div>

            {/* Delete button on hover */}
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    className="h-6 w-6 bg-black/50 hover:bg-destructive"
                    onClick={(e) => e.preventDefault()}
                    disabled={deleting === image.id}
                  >
                    {deleting === image.id ? (
                      <Loader2 className="h-3 w-3 animate-spin text-white" />
                    ) : (
                      <Trash2 className="h-3 w-3 text-white" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this image and its file. Anyone with the link will no longer be able to access it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => deleteImage(image.id, e)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* View Icon */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center bg-primary">
                <ExternalLink className="h-3 w-3 text-primary-foreground" />
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
