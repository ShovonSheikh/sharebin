import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { loadLanguage, hljs } from '@/lib/highlightLoader';
import 'highlight.js/styles/atom-one-dark.css';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
    content: string;
    syntax: string;
    showLineNumbers?: boolean;
    maxHeight?: string;
    className?: string;
}

export function CodeBlock({
    content,
    syntax,
    showLineNumbers = true,
    maxHeight,
    className,
}: CodeBlockProps) {
    const codeRef = useRef<HTMLElement>(null);
    const [copied, setCopied] = useState(false);
    const [isHighlighted, setIsHighlighted] = useState(false);

    useEffect(() => {
        const highlight = async () => {
            if (!codeRef.current) return;

            setIsHighlighted(false);

            // Load the language grammar dynamically
            await loadLanguage(syntax);

            // Reset previous highlighting
            codeRef.current.removeAttribute('data-highlighted');
            codeRef.current.className = `language-${syntax}`;

            // Apply highlighting
            hljs.highlightElement(codeRef.current);
            setIsHighlighted(true);
        };

        highlight();
    }, [content, syntax]);

    const copyContent = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy');
        }
    };

    const lines = content.split('\n');
    const lineCount = lines.length;
    // Calculate gutter width based on line count digits
    const gutterWidth = Math.max(String(lineCount).length * 0.6 + 1, 2);

    return (
        <Card
            className={cn(
                'bg-[#282c34] border-[#3e4451] overflow-hidden relative group',
                className
            )}
        >
            {/* Copy Button - visible on hover */}
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    'absolute top-2 right-2 z-10 h-8 w-8',
                    'bg-white/10 hover:bg-white/20 backdrop-blur-sm',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                    'border border-white/10'
                )}
                onClick={copyContent}
                title="Copy to clipboard"
            >
                {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                ) : (
                    <Copy className="h-4 w-4 text-white/70" />
                )}
            </Button>

            {/* Loading indicator */}
            {!isHighlighted && (
                <div className="absolute top-2 left-2 z-10">
                    <div className="h-2 w-2 rounded-full bg-primary/50 animate-pulse" />
                </div>
            )}

            {/* Code content */}
            <div
                className="overflow-auto"
                style={{ maxHeight: maxHeight || undefined }}
            >
                <pre className="p-0 m-0 text-sm leading-relaxed font-mono">
                    <div className="flex">
                        {/* Line numbers gutter */}
                        {showLineNumbers && (
                            <div
                                className="flex-shrink-0 select-none text-right pr-4 py-4 pl-4 text-white/30 bg-black/20 border-r border-white/10"
                                style={{ minWidth: `${gutterWidth}rem` }}
                                aria-hidden="true"
                            >
                                {lines.map((_, index) => (
                                    <div key={index} className="leading-relaxed">
                                        {index + 1}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Code content */}
                        <code
                            ref={codeRef}
                            className={cn(
                                `language-${syntax}`,
                                'block py-4 px-4 flex-1 overflow-x-auto'
                            )}
                        >
                            {content}
                        </code>
                    </div>
                </pre>
            </div>
        </Card>
    );
}
