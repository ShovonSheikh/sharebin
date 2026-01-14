import { useEffect, useRef, useState, useMemo } from 'react';
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
    const [copied, setCopied] = useState(false);
    const [highlightedLines, setHighlightedLines] = useState<string[]>([]);
    const [isHighlighted, setIsHighlighted] = useState(false);

    const isPlaintext = syntax === 'plaintext' || syntax === 'text';
    const lines = useMemo(() => content.split('\n'), [content]);
    const lineCount = lines.length;
    // Calculate gutter width based on line count digits
    const gutterWidth = Math.max(String(lineCount).length * 0.6 + 1, 2.5);

    useEffect(() => {
        const highlight = async () => {
            if (isPlaintext) {
                // No highlighting needed for plaintext
                setHighlightedLines(lines.map(line => escapeHtml(line) || '&nbsp;'));
                setIsHighlighted(true);
                return;
            }

            setIsHighlighted(false);

            // Load the language grammar dynamically
            await loadLanguage(syntax);

            // Highlight entire content first, then split by lines
            try {
                const result = hljs.highlight(content, { language: syntax, ignoreIllegals: true });
                const highlighted = result.value;
                
                // Split highlighted HTML by newlines while preserving tags
                const splitHighlightedLines = splitHtmlByLines(highlighted, lines.length);
                setHighlightedLines(splitHighlightedLines);
                setIsHighlighted(true);
            } catch (err) {
                // Fallback to escaped content
                setHighlightedLines(lines.map(line => escapeHtml(line) || '&nbsp;'));
                setIsHighlighted(true);
            }
        };

        highlight();
    }, [content, syntax, isPlaintext, lines]);

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

    // Special styling for plaintext - larger, more readable display
    if (isPlaintext) {
        return (
            <Card
                className={cn(
                    'bg-secondary border-border overflow-hidden relative group w-full',
                    className
                )}
            >
                {/* Copy Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'absolute top-3 right-3 z-10 h-8 w-8',
                        'bg-background/80 hover:bg-background backdrop-blur-sm',
                        'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                        'border border-border'
                    )}
                    onClick={copyContent}
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                </Button>

                <div
                    className="overflow-auto"
                    style={{ maxHeight: maxHeight || undefined }}
                >
                    <pre className="p-6 m-0 text-base font-mono leading-relaxed min-h-[150px] whitespace-pre-wrap break-words text-foreground">
                        {content}
                    </pre>
                </div>
            </Card>
        );
    }

    return (
        <Card
            className={cn(
                'bg-[#282c34] border-[#3e4451] overflow-hidden relative group w-full',
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

            {/* Code content - Line by line rendering for perfect alignment */}
            <div
                className="overflow-auto"
                style={{ maxHeight: maxHeight || undefined }}
            >
                <div className="font-mono text-sm">
                    {highlightedLines.map((lineHtml, index) => (
                        <div 
                            key={index} 
                            className="flex hover:bg-white/5 transition-colors"
                            style={{ minHeight: '1.5rem', lineHeight: '1.5rem' }}
                        >
                            {/* Line number */}
                            {showLineNumbers && (
                                <div
                                    className="flex-shrink-0 select-none text-right pr-4 py-0 text-white/30 bg-black/20 border-r border-white/10"
                                    style={{ 
                                        minWidth: `${gutterWidth}rem`,
                                        paddingLeft: '1rem',
                                        paddingTop: index === 0 ? '1rem' : '0',
                                        paddingBottom: index === highlightedLines.length - 1 ? '1rem' : '0',
                                    }}
                                    aria-hidden="true"
                                >
                                    <span style={{ lineHeight: '1.5rem' }}>{index + 1}</span>
                                </div>
                            )}

                            {/* Code line */}
                            <div
                                className="flex-1 px-4"
                                style={{ 
                                    paddingTop: index === 0 ? '1rem' : '0',
                                    paddingBottom: index === highlightedLines.length - 1 ? '1rem' : '0',
                                }}
                            >
                                <code
                                    className="hljs whitespace-pre"
                                    style={{ lineHeight: '1.5rem' }}
                                    dangerouslySetInnerHTML={{ __html: lineHtml }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

// Escape HTML entities
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Split highlighted HTML content by lines while preserving span tags
function splitHtmlByLines(html: string, expectedLines: number): string[] {
    // First try splitting by newlines in the HTML
    const result: string[] = [];
    let currentLine = '';
    let openTags: string[] = [];
    
    const tagRegex = /<\/?span[^>]*>/g;
    const parts = html.split(/(\n)/);
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (part === '\n') {
            // Close all open tags and push the line
            let closingTags = '';
            for (let j = openTags.length - 1; j >= 0; j--) {
                closingTags += '</span>';
            }
            result.push(currentLine + closingTags || '&nbsp;');
            
            // Start new line with reopened tags
            currentLine = openTags.join('');
        } else {
            // Process part, tracking open/close tags
            let lastIndex = 0;
            let match;
            
            while ((match = tagRegex.exec(part)) !== null) {
                currentLine += part.slice(lastIndex, match.index);
                const tag = match[0];
                
                if (tag.startsWith('</')) {
                    // Closing tag
                    openTags.pop();
                } else {
                    // Opening tag
                    openTags.push(tag);
                }
                
                currentLine += tag;
                lastIndex = match.index + tag.length;
            }
            
            currentLine += part.slice(lastIndex);
        }
    }
    
    // Push the last line
    if (currentLine || result.length < expectedLines) {
        let closingTags = '';
        for (let j = openTags.length - 1; j >= 0; j--) {
            closingTags += '</span>';
        }
        result.push(currentLine + closingTags || '&nbsp;');
    }
    
    // Ensure we have the expected number of lines
    while (result.length < expectedLines) {
        result.push('&nbsp;');
    }
    
    return result;
}
