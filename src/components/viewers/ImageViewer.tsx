import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
  fileName: string;
  fileSize?: number;
}

export function ImageViewer({ src, alt, fileName, fileSize }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setZoom(1);
      setRotation(0);
    }
  };

  return (
    <>
      <Card className="overflow-hidden bg-secondary border-border">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.25}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative overflow-auto bg-[#1a1a1a] min-h-[300px] max-h-[600px] flex items-center justify-center p-4">
          <img
            src={src}
            alt={alt}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-out',
              maxWidth: zoom === 1 ? '100%' : 'none',
              maxHeight: zoom === 1 ? '100%' : 'none',
            }}
            className="object-contain"
            draggable={false}
          />
        </div>
      </Card>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={toggleFullscreen}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-white min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleRotate(); }}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
              ✕
            </Button>
          </div>
          <img
            src={src}
            alt={alt}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-out',
            }}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  );
}
