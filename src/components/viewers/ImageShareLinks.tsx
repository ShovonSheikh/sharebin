import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Check, Link, Code, FileText, MessageSquare } from 'lucide-react';

interface ImageShareLinksProps {
  pasteId: string;
  fileName: string;
}

interface LinkFormat {
  name: string;
  icon: React.ReactNode;
  getValue: (directUrl: string, pageUrl: string) => string;
  label: string;
}

export function ImageShareLinks({ pasteId, fileName }: ImageShareLinksProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const baseUrl = window.location.origin;
  const directUrl = `${baseUrl}/i/${pasteId}`;
  const pageUrl = `${baseUrl}/p/${pasteId}`;

  const linkFormats: LinkFormat[] = [
    {
      name: 'Direct Link',
      icon: <Link className="h-4 w-4" />,
      getValue: () => directUrl,
      label: 'Use in <img src="..."> or anywhere',
    },
    {
      name: 'HTML',
      icon: <Code className="h-4 w-4" />,
      getValue: () => `<img src="${directUrl}" alt="${fileName}" />`,
      label: 'HTML image tag',
    },
    {
      name: 'HTML with Link',
      icon: <Code className="h-4 w-4" />,
      getValue: () => `<a href="${pageUrl}" target="_blank"><img src="${directUrl}" alt="${fileName}" /></a>`,
      label: 'Clickable image linking to page',
    },
    {
      name: 'Markdown',
      icon: <FileText className="h-4 w-4" />,
      getValue: () => `![${fileName}](${directUrl})`,
      label: 'For GitHub, Reddit, etc.',
    },
    {
      name: 'BBCode',
      icon: <MessageSquare className="h-4 w-4" />,
      getValue: () => `[img]${directUrl}[/img]`,
      label: 'For forums',
    },
    {
      name: 'BBCode with Link',
      icon: <MessageSquare className="h-4 w-4" />,
      getValue: () => `[url=${pageUrl}][img]${directUrl}[/img][/url]`,
      label: 'Clickable image for forums',
    },
  ];

  const copyToClipboard = async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
        <Link className="h-4 w-4 text-primary" />
        Image Embed Links
      </h3>
      <div className="space-y-3">
        {linkFormats.map((format, index) => {
          const value = format.getValue(directUrl, pageUrl);
          return (
            <div key={format.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  {format.icon}
                  {format.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(value, index)}
                  className="h-7 px-2"
                >
                  {copiedIndex === index ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <code className="block w-full bg-secondary px-3 py-2 rounded text-xs font-mono text-muted-foreground break-all">
                {value}
              </code>
              <p className="text-xs text-muted-foreground">{format.label}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
