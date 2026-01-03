import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Plus, Clock, Eye, Code, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { formatDate } from '@/lib/constants';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Share {
  id: string;
  content: string;
  title: string | null;
  syntax: string;
  expires_at: string | null;
  created_at: string;
  views: number;
}

interface ShareViewProps {
  share: Share;
}

export function ShareView({ share }: ShareViewProps) {
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    share.syntax === 'markdown' ? 'rendered' : 'code'
  );

  const shareUrl = `${window.location.origin}/s/${share.id}`;

  useEffect(() => {
    if (activeTab === 'code') {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [activeTab, share.content]);

  const copyContent = async () => {
    await navigator.clipboard.writeText(share.content);
    setCopied(true);
    toast.success('Content copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setUrlCopied(true);
    toast.success('URL copied to clipboard');
    setTimeout(() => setUrlCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1">
          {share.title && (
            <h1 className="text-2xl font-bold text-foreground">{share.title}</h1>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary" className="font-mono">
              {share.syntax}
            </Badge>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {share.views} views
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(share.created_at)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyContent} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy Text
          </Button>
          <Link to="/">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Tabs */}
      {share.syntax === 'markdown' ? (
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
                {share.content}
              </ReactMarkdown>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <CodeBlock content={share.content} syntax={share.syntax} />
          </TabsContent>
        </Tabs>
      ) : (
        <CodeBlock content={share.content} syntax={share.syntax} />
      )}

      {/* Share URL & QR Code */}
      <Card className="p-6 bg-card border-border">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-foreground">Share URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary px-4 py-2 rounded-md font-mono text-sm text-primary break-all">
                {shareUrl}
              </code>
              <Button variant="outline" size="icon" onClick={copyUrl}>
                {urlCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {share.expires_at && (
              <p className="text-xs text-muted-foreground">
                Expires: {formatDate(share.expires_at)}
              </p>
            )}
          </div>

          <div className="p-4 bg-foreground rounded-lg">
            <QRCodeSVG
              value={shareUrl}
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

function CodeBlock({ content, syntax }: { content: string; syntax: string }) {
  useEffect(() => {
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [content]);

  return (
    <Card className="bg-code border-code-border overflow-hidden">
      <pre className="p-6 overflow-x-auto">
        <code className={`language-${syntax}`}>
          {content}
        </code>
      </pre>
    </Card>
  );
}