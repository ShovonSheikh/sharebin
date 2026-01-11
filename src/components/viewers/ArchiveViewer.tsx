import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatFileSize, FILE_TYPES } from '@/lib/fileUtils';
import { Download, Archive, Package, FileArchive } from 'lucide-react';

interface ArchiveViewerProps {
  src: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

function getArchiveIcon(fileName: string) {
  const ext = fileName.toLowerCase();
  if (ext.endsWith('.zip')) return <FileArchive className="h-12 w-12" />;
  if (ext.endsWith('.rar')) return <Archive className="h-12 w-12" />;
  if (ext.endsWith('.7z')) return <Package className="h-12 w-12" />;
  return <Archive className="h-12 w-12" />;
}

function getArchiveTypeName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  // Handle double extensions
  if (fileName.toLowerCase().endsWith('.tar.gz') || fileName.toLowerCase().endsWith('.tgz')) {
    return 'Gzip Compressed Tar Archive';
  }
  if (fileName.toLowerCase().endsWith('.tar.bz2') || fileName.toLowerCase().endsWith('.tbz2')) {
    return 'Bzip2 Compressed Tar Archive';
  }

  const typeMap: Record<string, string> = {
    'zip': 'ZIP Archive',
    'rar': 'RAR Archive',
    '7z': '7-Zip Archive',
    'tar': 'Tar Archive',
    'gz': 'Gzip Archive',
    'bz2': 'Bzip2 Archive',
  };

  return typeMap[ext || ''] || 'Archive';
}

export function ArchiveViewer({ src, fileName, fileSize, fileType }: ArchiveViewerProps) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const typeName = getArchiveTypeName(fileName);

  return (
    <Card className="overflow-hidden bg-secondary border-border">
      {/* Archive Info */}
      <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="p-4 bg-primary/10 rounded-lg text-primary">
          {getArchiveIcon(fileName)}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold break-all">{fileName}</h3>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-muted-foreground">
            <span>{typeName}</span>
            <span>•</span>
            <span>{formatFileSize(fileSize)}</span>
          </div>
        </div>
        <Button onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download Archive
        </Button>
      </div>

      {/* Supported Formats Info */}
      <div className="px-6 pb-6">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2 font-medium">
            Supported archive formats:
          </p>
          <div className="flex flex-wrap gap-2">
            {FILE_TYPES.archive.extensions.map((ext) => (
              <span 
                key={ext} 
                className="px-2 py-1 bg-secondary rounded text-xs font-mono"
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
