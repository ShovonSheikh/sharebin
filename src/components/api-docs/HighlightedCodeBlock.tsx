import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { loadLanguage, hljs } from '@/lib/highlightLoader';

interface HighlightedCodeBlockProps {
  children: string;
  language?: string;
}

export function HighlightedCodeBlock({ children, language = 'plaintext' }: HighlightedCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState<string>(children);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const highlightCode = async () => {
      // Map some language names
      const langMap: Record<string, string> = {
        'bash': 'bash',
        'shell': 'bash',
        'sh': 'bash',
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
      };

      const normalizedLang = langMap[language] || language;
      
      try {
        await loadLanguage(normalizedLang);
        const result = hljs.highlight(children, { language: normalizedLang, ignoreIllegals: true });
        setHighlighted(result.value);
      } catch {
        // Fallback to plain text if highlighting fails
        setHighlighted(children);
      }
    };

    highlightCode();
  }, [children, language]);

  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group overflow-hidden max-w-full">
      <pre className="bg-secondary/50 rounded-lg p-4 overflow-x-auto border border-border">
        <code
          ref={codeRef}
          className={`text-sm font-mono whitespace-pre-wrap break-all hljs language-${language}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={copy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
