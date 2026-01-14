// File type definitions and validation utilities

export const FILE_TYPES = {
  image: {
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp'] as string[],
    mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/bmp'] as string[],
    maxSize: 10 * 1024 * 1024, // 10MB
    label: 'Images',
  },
  video: {
    extensions: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv'] as string[],
    mimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/x-m4v',
      'video/ogg',
    ] as string[],
    maxSize: 100 * 1024 * 1024, // 100MB
    label: 'Videos',
  },
  document: {
    extensions: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.odt', '.ods', '.odp', '.txt', '.rtf', '.csv'] as string[],
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      'text/plain',
      'application/rtf',
      'text/csv',
    ] as string[],
    maxSize: 25 * 1024 * 1024, // 25MB
    label: 'Documents',
  },
  archive: {
    extensions: ['.zip', '.rar', '.7z', '.tar', '.tar.gz', '.tgz', '.tar.bz2', '.tbz2', '.gz', '.bz2'] as string[],
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/vnd.rar',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      'application/x-gzip',
      'application/x-bzip2',
      'application/x-compressed-tar',
    ] as string[],
    maxSize: 50 * 1024 * 1024, // 50MB
    label: 'Archives (Zipped Folders)',
  },
} as const;

export type ContentType = 'text' | 'image' | 'video' | 'document' | 'archive';

// Extension to syntax mapping for auto-detection
const extensionToSyntax: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.c': 'cpp',
  '.h': 'cpp',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.go': 'go',
  '.rs': 'rust',
  '.php': 'php',
  '.rb': 'ruby',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'scss',
  '.less': 'css',
  '.json': 'json',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.sql': 'sql',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.ps1': 'powershell',
  '.dockerfile': 'dockerfile',
  '.tf': 'yaml', // terraform
  '.toml': 'yaml',
  '.ini': 'yaml',
  '.cfg': 'yaml',
  '.conf': 'yaml',
  '.env': 'bash',
  '.gitignore': 'bash',
  '.txt': 'plaintext',
  '.log': 'plaintext',
};

export function detectSyntaxFromExtension(filename: string): string {
  const ext = getFileExtension(filename).toLowerCase();
  return extensionToSyntax[ext] || 'plaintext';
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  
  // Handle double extensions like .tar.gz
  const name = filename.toLowerCase();
  if (name.endsWith('.tar.gz')) return '.tar.gz';
  if (name.endsWith('.tar.bz2')) return '.tar.bz2';
  
  return name.slice(lastDot);
}

export function detectContentType(file: File): ContentType | null {
  const extension = getFileExtension(file.name);
  const mimeType = file.type;

  // Check images first
  if (FILE_TYPES.image.extensions.includes(extension) || FILE_TYPES.image.mimeTypes.includes(mimeType)) {
    return 'image';
  }

  // Check videos
  if (FILE_TYPES.video.extensions.includes(extension) || FILE_TYPES.video.mimeTypes.includes(mimeType)) {
    return 'video';
  }

  // Check archives
  if (FILE_TYPES.archive.extensions.includes(extension) || FILE_TYPES.archive.mimeTypes.includes(mimeType)) {
    return 'archive';
  }

  // Check documents
  if (FILE_TYPES.document.extensions.includes(extension) || FILE_TYPES.document.mimeTypes.includes(mimeType)) {
    return 'document';
  }

  return null;
}

export function validateFile(file: File): { valid: boolean; error?: string; contentType?: ContentType } {
  const contentType = detectContentType(file);
  
  if (!contentType) {
    return { 
      valid: false, 
      error: `Unsupported file type. Supported formats: ${getAllSupportedExtensions().join(', ')}` 
    };
  }

  const config = FILE_TYPES[contentType];
  if (file.size > config.maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size for ${config.label.toLowerCase()}: ${formatFileSize(config.maxSize)}` 
    };
  }

  return { valid: true, contentType };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getAllSupportedExtensions(): string[] {
  return [
    ...FILE_TYPES.image.extensions,
    ...FILE_TYPES.video.extensions,
    ...FILE_TYPES.document.extensions,
    ...FILE_TYPES.archive.extensions,
  ];
}

export function getAcceptString(): string {
  const allMimeTypes = [
    ...FILE_TYPES.image.mimeTypes,
    ...FILE_TYPES.video.mimeTypes,
    ...FILE_TYPES.document.mimeTypes,
    ...FILE_TYPES.archive.mimeTypes,
  ];
  const allExtensions = getAllSupportedExtensions();
  return [...allMimeTypes, ...allExtensions].join(',');
}

export function getFileIcon(contentType: ContentType, mimeType?: string): string {
  switch (contentType) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'archive':
      return 'archive';
    case 'document':
      if (mimeType?.includes('pdf')) return 'file-text';
      if (mimeType?.includes('word') || mimeType?.includes('document')) return 'file-text';
      if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return 'table';
      if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return 'presentation';
      return 'file';
    default:
      return 'file';
  }
}

export function generateFilePath(userId: string | null): string {
  const prefix = userId || 'anonymous';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `${prefix}/${timestamp}-${randomId}`;
}
