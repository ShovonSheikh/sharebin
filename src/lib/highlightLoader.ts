/**
 * Dynamic Highlight.js Language Loader
 * 
 * Loads language grammars on-demand to reduce initial bundle size.
 * Core hljs is ~40KB, each language adds ~1-10KB when loaded.
 */
import hljs from 'highlight.js/lib/core';

// Language import mapping based on SYNTAX_OPTIONS in constants.ts
const languageImports: Record<string, () => Promise<{ default: any }>> = {
    plaintext: () => import('highlight.js/lib/languages/plaintext'),
    javascript: () => import('highlight.js/lib/languages/javascript'),
    typescript: () => import('highlight.js/lib/languages/typescript'),
    python: () => import('highlight.js/lib/languages/python'),
    java: () => import('highlight.js/lib/languages/java'),
    csharp: () => import('highlight.js/lib/languages/csharp'),
    cpp: () => import('highlight.js/lib/languages/cpp'),
    go: () => import('highlight.js/lib/languages/go'),
    rust: () => import('highlight.js/lib/languages/rust'),
    php: () => import('highlight.js/lib/languages/php'),
    ruby: () => import('highlight.js/lib/languages/ruby'),
    swift: () => import('highlight.js/lib/languages/swift'),
    kotlin: () => import('highlight.js/lib/languages/kotlin'),
    html: () => import('highlight.js/lib/languages/xml'), // xml covers html
    css: () => import('highlight.js/lib/languages/css'),
    scss: () => import('highlight.js/lib/languages/scss'),
    json: () => import('highlight.js/lib/languages/json'),
    xml: () => import('highlight.js/lib/languages/xml'),
    yaml: () => import('highlight.js/lib/languages/yaml'),
    markdown: () => import('highlight.js/lib/languages/markdown'),
    sql: () => import('highlight.js/lib/languages/sql'),
    bash: () => import('highlight.js/lib/languages/bash'),
    powershell: () => import('highlight.js/lib/languages/powershell'),
    dockerfile: () => import('highlight.js/lib/languages/dockerfile'),
};

// Track loaded languages to avoid redundant imports
const loadedLanguages = new Set<string>();

/**
 * Load a specific language grammar dynamically
 */
export async function loadLanguage(language: string): Promise<boolean> {
    // Normalize language name
    const lang = language.toLowerCase();

    // Already loaded
    if (loadedLanguages.has(lang)) {
        return true;
    }

    // No loader available for this language
    if (!languageImports[lang]) {
        console.warn(`[highlightLoader] No grammar available for: ${lang}`);
        return false;
    }

    try {
        const module = await languageImports[lang]();
        hljs.registerLanguage(lang, module.default);
        loadedLanguages.add(lang);
        return true;
    } catch (err) {
        console.error(`[highlightLoader] Failed to load language: ${lang}`, err);
        return false;
    }
}

/**
 * Highlight a code element with the specified language
 * Automatically loads the language grammar if not already loaded
 */
export async function highlightCode(
    element: HTMLElement,
    language: string
): Promise<void> {
    await loadLanguage(language);

    // Clear any previous highlighting
    element.removeAttribute('data-highlighted');
    element.className = `language-${language}`;

    hljs.highlightElement(element);
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
    return language.toLowerCase() in languageImports;
}

/**
 * Get list of all supported languages
 */
export function getSupportedLanguages(): string[] {
    return Object.keys(languageImports);
}

export { hljs };
