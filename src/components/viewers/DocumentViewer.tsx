import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatFileSize } from '@/lib/fileUtils';
import { Download, FileText, Table, Presentation, File, ExternalLink } from 'lucide-react';

interface DocumentViewerProps {
  src: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

function getDocumentIcon(fileType: string) {
  if (fileType.includes('pdf')) return <FileText className="h-12 w-12" />;
  if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-12 w-12" />;
  if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('csv')) return <Table className="h-12 w-12" />;
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <Presentation className="h-12 w-12" />;
  return <File className="h-12 w-12" />;
}

function getDocumentTypeName(fileType: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const typeMap: Record<string, string> = {
    'pdf': 'PDF Document',
    'doc': 'Word Document',
    'docx': 'Word Document',
    'xls': 'Excel Spreadsheet',
    'xlsx': 'Excel Spreadsheet',
    'csv': 'CSV Spreadsheet',
    'ppt': 'PowerPoint Presentation',
    'pptx': 'PowerPoint Presentation',
    'odt': 'OpenDocument Text',
    'ods': 'OpenDocument Spreadsheet',
    'odp': 'OpenDocument Presentation',
    'txt': 'Text File',
    'rtf': 'Rich Text Document',
  };

  return typeMap[ext || ''] || 'Document';
}

function canPreview(fileType: string): boolean {
  return fileType.includes('pdf');
}

export function DocumentViewer({ src, fileName, fileSize, fileType }: DocumentViewerProps) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const typeName = getDocumentTypeName(fileType, fileName);
  const showPreview = canPreview(fileType);

  // Google Docs Viewer URL for PDF preview
  const previewUrl = showPreview ? src : null;

  return (
    <Card className="overflow-hidden bg-secondary border-border">
      {/* Document Info */}
      <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="p-4 bg-primary/10 rounded-lg text-primary">
          {getDocumentIcon(fileType)}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold break-all">{fileName}</h3>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-muted-foreground">
            <span>{typeName}</span>
            <span>•</span>
            <span>{formatFileSize(fileSize)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          {showPreview && (
            <Button variant="outline" asChild className="gap-2">
              <a href={src} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open in Browser
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* PDF Preview */}
      {previewUrl && (
        <div className="border-t border-border">
          <iframe
            src={previewUrl}
            className="w-full h-[500px]"
            title={fileName}
          />
        </div>
      )}
    </Card>
  );
}
