import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatFileSize } from '@/lib/fileUtils';
import { Download, Play, Pause, Volume2, VolumeX, Maximize2, Video, Lock } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface VideoViewerProps {
  src: string;
  fileName: string;
  fileSize?: number;
  isProtected?: boolean;
}

export function VideoViewer({ src, fileName, fileSize, isProtected = false }: VideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const vol = value[0];
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleDownload = async () => {
    if (isProtected) return;
    
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
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden bg-secondary border-border">
      {/* Video Container */}
      <div 
        className={`relative bg-black ${isProtected ? 'select-none' : ''}`}
        onContextMenu={isProtected ? (e) => e.preventDefault() : undefined}
      >
        {/* Protection Overlay */}
        {isProtected && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
              <Lock className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-yellow-500 font-medium">Protected Content</span>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          src={src}
          className="w-full max-h-[500px] object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          controlsList={isProtected ? "nodownload" : undefined}
          disablePictureInPicture={isProtected}
        />
      </div>

      {/* Custom Controls */}
      <div className="p-4 space-y-3 bg-card border-t border-border">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground min-w-[40px] text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={togglePlay}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleMute}>
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              <Video className="h-4 w-4" />
              <span className="truncate max-w-[150px]">{fileName}</span>
              {fileSize && <span>• {formatFileSize(fileSize)}</span>}
            </div>

            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            
            {!isProtected && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
