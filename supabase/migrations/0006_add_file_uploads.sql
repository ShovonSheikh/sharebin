-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

-- RLS Policies for uploads bucket
CREATE POLICY "Anyone can view public uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

CREATE POLICY "Anyone can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add file-related columns to shares table
ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text';

-- Add check constraint for content_type
ALTER TABLE public.shares ADD CONSTRAINT shares_content_type_check 
CHECK (content_type IN ('text', 'image', 'document', 'archive'));