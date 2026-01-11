import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Plus, Clock, Eye, Code, FileText, Flame, ExternalLink, FileCode, Image, FileArchive, File } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/paste/CodeBlock';
import { ImageViewer } from '@/components/viewers/ImageViewer';
import { ImageShareLinks } from '@/components/viewers/ImageShareLinks';
import { DocumentViewer } from '@/components/viewers/DocumentViewer';
import { ArchiveViewer } from '@/components/viewers/ArchiveViewer';
import { formatDate } from '@/lib/constants';
import { formatFileSize } from '@/lib/fileUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

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
  // File upload fields
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  content_type?: string | null;
}

interface PasteViewProps {
  paste: Paste;
}

export function PasteView({ paste }: PasteViewProps) {
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(
    paste.syntax === 'markdown' ? 'rendered' : 'code'
  );

  const isFileUpload = paste.content_type && paste.content_type !== 'text' && paste.file_path;
  const isImage = paste.content_type === 'image';
  const isDocument = paste.content_type === 'document';
  const isArchive = paste.content_type === 'archive';

  const pasteUrl = `${window.location.origin}/p/${paste.id}`;
  const rawUrl = `${window.location.origin}/raw/${paste.id}`;
  const embedUrl = `${window.location.origin}/embed/${paste.id}`;
  const directImageUrl = isImage ? `${window.location.origin}/i/${paste.id}` : null;
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="400" frameborder="0" style="border-radius: 8px; border: 1px solid #333;"></iframe>`;

  // Get file URL for file uploads
  useEffect(() => {
    if (isFileUpload && paste.file_path) {
      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(paste.file_path);
      setFileUrl(data.publicUrl);
    }
  }, [paste.file_path, isFileUpload]);

  const copyContent = async () => {
    if (isFileUpload && fileUrl) {
      await navigator.clipboard.writeText(fileUrl);
    } else {
      await navigator.clipboard.writeText(paste.content);
    }
    setCopied(true);
    toast.success(isFileUpload ? 'File URL copied to clipboard' : 'Content copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(pasteUrl);
    setUrlCopied(true);
    toast.success('URL copied to clipboard');
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    toast.success('Embed code copied to clipboard');
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const getContentTypeIcon = () => {
    switch (paste.content_type) {
      case 'image': return <Image className="h-3 w-3 mr-1" />;
      case 'document': return <File className="h-3 w-3 mr-1" />;
      case 'archive': return <FileArchive className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const getContentTypeBadge = () => {
    if (!paste.content_type || paste.content_type === 'text') {
      return (
        <Badge variant="secondary" className="font-mono">
          {paste.syntax}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="font-mono flex items-center">
        {getContentTypeIcon()}
        {paste.content_type.charAt(0).toUpperCase() + paste.content_type.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Burn Warning */}
      {paste.burned && (
        <Card className="p-4 bg-orange-500/10 border-orange-500/20">
          <div className="flex items-center gap-3 text-orange-500">
            <Flame className="h-5 w-5" />
            <div>
              <p className="font-medium">This paste has been burned</p>
              <p className="text-sm opacity-80">
                This content was set to delete after reading. Save it now if you need it.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1">
          {paste.title && (
            <h1 className="text-2xl font-bold text-foreground">{paste.title}</h1>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {getContentTypeBadge()}
            {paste.burn_after_read && (
              <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                <Flame className="h-3 w-3 mr-1" />
                Burn after read
              </Badge>
            )}
            {isFileUpload && paste.file_size && (
              <span>{formatFileSize(paste.file_size)}</span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {paste.views} views
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(paste.created_at)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!paste.burn_after_read && !isFileUpload && (
            <a href={rawUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <FileCode className="h-4 w-4" />
                View Raw
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={copyContent} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isFileUpload ? 'Copy URL' : 'Copy Text'}
          </Button>
          <Link to="/">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </Link>
        </div>
      </div>

      {/* Content - File Viewers or Code Block */}
      {isFileUpload && fileUrl ? (
        <>
          {isImage && (
            <>
              <ImageViewer 
                src={fileUrl} 
                alt={paste.file_name || 'Image'} 
                fileName={paste.file_name || 'image'}
                fileSize={paste.file_size || undefined}
              />
              <ImageShareLinks 
                pasteId={paste.id} 
                fileName={paste.file_name || 'image'} 
              />
            </>
          )}
          {isDocument && (
            <DocumentViewer
              src={fileUrl}
              fileName={paste.file_name || 'document'}
              fileSize={paste.file_size || 0}
              fileType={paste.file_type || 'application/octet-stream'}
            />
          )}
          {isArchive && (
            <ArchiveViewer
              src={fileUrl}
              fileName={paste.file_name || 'archive'}
              fileSize={paste.file_size || 0}
              fileType={paste.file_type || 'application/octet-stream'}
            />
          )}
        </>
      ) : paste.syntax === 'markdown' ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="rendered" className="gap-2">
              <FileText className="h-4 w-4" />
              Rendered
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="h-4 w-4" />
              Source
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rendered" className="mt-4">
            <Card className="p-6 bg-secondary border-border prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {paste.content}
              </ReactMarkdown>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <CodeBlock 
              content={paste.content} 
              syntax={paste.syntax} 
              showLineNumbers={false}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <CodeBlock 
          content={paste.content} 
          syntax={paste.syntax} 
          showLineNumbers={paste.syntax !== 'plaintext' && paste.syntax !== 'text'}
        />
      )}

      {/* Share URL & QR Code */}
      <Card className="p-6 bg-card border-border">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {isImage ? 'Page URL' : 'Paste URL'}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-secondary px-4 py-2 rounded-md font-mono text-sm text-primary break-all">
                  {pasteUrl}
                </code>
                <Button variant="outline" size="icon" onClick={copyUrl}>
                  {urlCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Direct Image URL */}
            {isImage && directImageUrl && !paste.burn_after_read && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Direct Image Link
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-secondary px-4 py-2 rounded-md font-mono text-sm text-muted-foreground break-all">
                    {directImageUrl}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => {
                    navigator.clipboard.writeText(directImageUrl);
                    toast.success('Direct link copied');
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this link in &lt;img src="..."&gt; tags to embed the image anywhere
                </p>
              </div>
            )}

            {/* Embed Code - only for text content */}
            {!paste.burn_after_read && !isFileUpload && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Embed Code
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-secondary px-4 py-2 rounded-md font-mono text-xs text-muted-foreground break-all line-clamp-1">
                    {embedCode}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyEmbed}>
                    {embedCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {paste.expires_at && (
              <p className="text-xs text-muted-foreground">
                Expires: {formatDate(paste.expires_at)}
              </p>
            )}
          </div>

          <div className="p-4 bg-foreground rounded-lg">
            <QRCodeSVG
              value={pasteUrl}
              size={100}
              bgColor="hsl(210, 20%, 95%)"
              fgColor="hsl(220, 20%, 10%)"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
