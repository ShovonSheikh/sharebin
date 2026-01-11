import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EXPIRATION_OPTIONS, getExpirationDate, hashPassword } from '@/lib/constants';
import { 
  validateFile, 
  formatFileSize, 
  getAcceptString, 
  FILE_TYPES,
  generateFilePath,
  ContentType 
} from '@/lib/fileUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Upload, 
  Loader2, 
  Lock, 
  Flame, 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  X,
  FileImage,
  FileText,
  FileArchive,
  Share2,
  Image,
  File,
  Package
} from 'lucide-react';

interface UploadedFile {
  file: File;
  preview?: string;
  contentType: ContentType;
}

export function FileUploadForm() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [title, setTitle] = useState('');
  const [expiration, setExpiration] = useState('never');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createdPasteUrl, setCreatedPasteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);
    
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const newFile: UploadedFile = {
      file,
      contentType: validation.contentType!,
    };

    // Create preview for images
    if (validation.contentType === 'image') {
      newFile.preview = URL.createObjectURL(file);
    }

    setUploadedFile(newFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Generate unique file path
      const filePath = generateFilePath(user?.id || null);
      const fullPath = `${filePath}/${uploadedFile.file.name}`;

      // Upload file to storage
      setUploadProgress(25);
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fullPath, uploadedFile.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      // Create share record
      const expiresAt = getExpirationDate(expiration);
      const passwordHash = password ? await hashPassword(password) : null;

      const { data, error: insertError } = await supabase
        .from('shares')
        .insert({
          content: '', // No text content for file uploads
          title: title.trim() || uploadedFile.file.name,
          syntax: 'plaintext',
          expires_at: expiresAt?.toISOString() || null,
          user_id: user?.id || null,
          password_hash: passwordHash,
          burn_after_read: burnAfterRead,
          file_path: fullPath,
          file_name: uploadedFile.file.name,
          file_size: uploadedFile.file.size,
          file_type: uploadedFile.file.type,
          content_type: uploadedFile.contentType,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      setUploadProgress(100);

      const features = [];
      if (password) features.push('password protected');
      if (burnAfterRead) features.push('burn after reading');

      const message = features.length > 0
        ? `File uploaded (${features.join(', ')})!`
        : 'File uploaded successfully!';

      toast.success(message);

      if (burnAfterRead) {
        setCreatedPasteUrl(`${window.location.origin}/p/${data.id}`);
      } else {
        navigate(`/p/${data.id}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const copyPasteUrl = async () => {
    if (createdPasteUrl) {
      await navigator.clipboard.writeText(createdPasteUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    removeFile();
    setTitle('');
    setExpiration('never');
    setPassword('');
    setBurnAfterRead(false);
    setCreatedPasteUrl(null);
    setCopied(false);
  };

  // Show success screen for burn-after-read uploads
  if (createdPasteUrl) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="mx-auto p-4 rounded-full bg-orange-500/10 w-fit">
          <Flame className="h-12 w-12 text-orange-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Burn File Uploaded!</h2>
          <p className="text-muted-foreground">
            This link will self-destruct after being viewed once.
          </p>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-2">Share this file:</p>
          <div className="flex items-center gap-2">
            <Input
              value={createdPasteUrl}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <Button onClick={copyPasteUrl} variant="outline" className="shrink-0 gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-sm text-orange-500 bg-orange-500/10 p-3 rounded-lg">
          <Flame className="h-4 w-4" />
          <span>Do NOT open this link yourself - it will be deleted after the first view!</span>
        </div>

        <Button onClick={resetForm} variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Another File
        </Button>
      </div>
    );
  }

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'image': return <FileImage className="h-8 w-8 text-primary" />;
      case 'document': return <FileText className="h-8 w-8 text-primary" />;
      case 'archive': return <FileArchive className="h-8 w-8 text-primary" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          }
          ${uploadedFile ? 'border-solid border-primary/30' : ''}
        `}
        onClick={() => !uploadedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          accept={getAcceptString()}
          className="hidden"
        />

        {uploadedFile ? (
          <div className="flex items-center gap-4">
            {uploadedFile.preview ? (
              <img 
                src={uploadedFile.preview} 
                alt="Preview" 
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center bg-secondary rounded-lg">
                {getContentTypeIcon(uploadedFile.contentType)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{uploadedFile.file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(uploadedFile.file.size)} • {FILE_TYPES[uploadedFile.contentType].label}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">
              Drop your file here or click to browse
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                Images (max 10MB)
              </span>
              <span className="flex items-center gap-1">
                <File className="h-4 w-4" />
                Documents (max 25MB)
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                Archives (max 50MB)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supported: PNG, JPG, GIF, WEBP, SVG • PDF, DOC, XLS, PPT • ZIP, RAR, 7Z, TAR.GZ
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {loading && uploadProgress > 0 && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Title Input */}
      <Input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-secondary border-border"
        maxLength={100}
      />

      {/* Security Options */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
        <div className="flex-1 space-y-2">
          <Label htmlFor="file-password" className="flex items-center gap-2 text-sm font-medium">
            <Lock className="h-4 w-4 text-primary" />
            Password Protection
          </Label>
          <div className="relative">
            <Input
              id="file-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Optional password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-border pr-10"
              maxLength={100}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:pt-6">
          <Switch
            id="file-burn"
            checked={burnAfterRead}
            onCheckedChange={setBurnAfterRead}
          />
          <Label htmlFor="file-burn" className="flex items-center gap-2 cursor-pointer">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm">Burn after reading</span>
          </Label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={expiration} onValueChange={setExpiration}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Expiration" />
            </SelectTrigger>
            <SelectContent>
              {EXPIRATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={loading || !uploadedFile}
          className="gap-2 glow-primary"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          Upload & Share
        </Button>
      </div>

      {burnAfterRead && (
        <p className="text-sm text-orange-500 flex items-center gap-2">
          <Flame className="h-4 w-4" />
          This file will be permanently deleted after it's viewed once.
        </p>
      )}
    </form>
  );
}
