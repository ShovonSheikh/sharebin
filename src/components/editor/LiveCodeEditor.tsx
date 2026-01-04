import { useEffect, useRef, useState, useDeferredValue, useCallback } from 'react';
import { loadLanguage, hljs } from '@/lib/highlightLoader';
import 'highlight.js/styles/atom-one-dark.css';
import { cn } from '@/lib/utils';

interface LiveCodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: string;
    placeholder?: string;
    minHeight?: string;
    maxLength?: number;
    className?: string;
    disabled?: boolean;
}

/**
 * LiveCodeEditor - A textarea with real-time syntax highlighting
 * 
 * Uses the "overlay technique" where a transparent textarea sits
 * on top of a highlighted <pre><code> block. User types in the
 * textarea while seeing the highlighted code beneath.
 */
export function LiveCodeEditor({
    value,
    onChange,
    language,
    placeholder = 'Enter code...',
    minHeight = '180px',
    maxLength,
    className,
    disabled = false,
}: LiveCodeEditorProps) {
    const codeRef = useRef<HTMLElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHighlighted, setIsHighlighted] = useState(false);

    // Defer highlighting for performance during rapid typing
    const deferredValue = useDeferredValue(value);

    // Sync scroll between textarea and code block
    const handleScroll = useCallback(() => {
        if (textareaRef.current && containerRef.current) {
            const scrollContainer = containerRef.current.querySelector('.code-display');
            if (scrollContainer) {
                scrollContainer.scrollTop = textareaRef.current.scrollTop;
                scrollContainer.scrollLeft = textareaRef.current.scrollLeft;
            }
        }
    }, []);

    // Apply syntax highlighting
    useEffect(() => {
        const highlight = async () => {
            if (!codeRef.current) return;

            setIsHighlighted(false);
            await loadLanguage(language);

            // Reset and apply highlighting
            codeRef.current.removeAttribute('data-highlighted');
            codeRef.current.className = `language-${language}`;

            // Only highlight if there's content
            if (deferredValue) {
                hljs.highlightElement(codeRef.current);
            }
            setIsHighlighted(true);
        };

        highlight();
    }, [deferredValue, language]);

    // Shared text styles that MUST match between textarea and code
    const textStyles = {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        letterSpacing: 'normal',
        wordSpacing: 'normal',
        whiteSpace: 'pre-wrap' as const,
        wordWrap: 'break-word' as const,
        tabSize: 2,
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative rounded-lg border border-[#3e4451] bg-[#282c34] overflow-hidden',
                className
            )}
            style={{ minHeight }}
        >
            {/* Loading indicator */}
            {!isHighlighted && value && (
                <div className="absolute top-2 right-2 z-20">
                    <div className="h-2 w-2 rounded-full bg-primary/50 animate-pulse" />
                </div>
            )}

            {/* Code display layer (visible, non-interactive) */}
            <div
                className="code-display absolute inset-0 overflow-auto pointer-events-none"
                aria-hidden="true"
            >
                <pre
                    className="p-4 m-0"
                    style={{
                        ...textStyles,
                        minHeight,
                    }}
                >
                    <code
                        ref={codeRef}
                        className={`language-${language}`}
                        style={textStyles}
                    >
                        {value || (
                            <span className="text-white/30">{placeholder}</span>
                        )}
                    </code>
                </pre>
            </div>

            {/* Textarea layer (invisible text, receives all input) */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                placeholder=""
                maxLength={maxLength}
                disabled={disabled}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className={cn(
                    'relative z-10 w-full h-full resize-none bg-transparent',
                    'text-transparent selection:bg-primary/30',
                    'focus:outline-none focus:ring-0',
                    'p-4',
                    disabled && 'cursor-not-allowed opacity-50'
                )}
                style={{
                    ...textStyles,
                    minHeight,
                    caretColor: '#abb2bf', // Visible cursor
                    WebkitTextFillColor: 'transparent', // Ensure text is transparent in Safari
                }}
            />
        </div>
    );
}
