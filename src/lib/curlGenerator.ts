/**
 * cURL Command Generator
 * 
 * Generates formatted cURL commands from API request parameters.
 * Designed for use in API documentation with live updates.
 */

interface CurlOptions {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    apiKey?: string;
    headers?: Record<string, string>;
    body?: Record<string, any>;
    multiline?: boolean;
}

/**
 * Generate a cURL command string from request options
 */
export function generateCurl(options: CurlOptions): string {
    const { method, url, apiKey, headers = {}, body, multiline = true } = options;

    const parts: string[] = [];
    const separator = multiline ? ' \\\n  ' : ' ';

    // Method and URL
    if (method !== 'GET') {
        parts.push(`curl -X ${method}`);
    } else {
        parts.push('curl');
    }
    parts.push(`"${url}"`);

    // Authorization header
    if (apiKey) {
        parts.push(`-H "Authorization: Bearer ${apiKey}"`);
    }

    // Content-Type for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        parts.push('-H "Content-Type: application/json"');
    }

    // Custom headers
    Object.entries(headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'authorization' && key.toLowerCase() !== 'content-type') {
            parts.push(`-H "${key}: ${value}"`);
        }
    });

    // Request body
    if (body && Object.keys(body).length > 0) {
        // Filter out undefined values
        const cleanBody = Object.fromEntries(
            Object.entries(body).filter(([_, v]) => v !== undefined && v !== '')
        );

        if (Object.keys(cleanBody).length > 0) {
            const bodyStr = JSON.stringify(cleanBody, null, multiline ? 2 : 0);
            parts.push(`-d '${bodyStr}'`);
        }
    }

    return parts.join(separator);
}

/**
 * Generate JavaScript fetch code from request options
 */
export function generateFetch(options: CurlOptions): string {
    const { method, url, apiKey, headers = {}, body } = options;

    const fetchHeaders: Record<string, string> = {};

    if (apiKey) {
        fetchHeaders['Authorization'] = `Bearer ${apiKey}`;
    }

    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        fetchHeaders['Content-Type'] = 'application/json';
    }

    Object.entries(headers).forEach(([key, value]) => {
        fetchHeaders[key] = value;
    });

    // Filter out undefined values from body
    const cleanBody = body ? Object.fromEntries(
        Object.entries(body).filter(([_, v]) => v !== undefined && v !== '')
    ) : null;

    const hasBody = cleanBody && Object.keys(cleanBody).length > 0;

    let code = `const response = await fetch("${url}", {\n`;
    code += `  method: "${method}",\n`;

    if (Object.keys(fetchHeaders).length > 0) {
        code += `  headers: ${JSON.stringify(fetchHeaders, null, 2).split('\n').join('\n  ')},\n`;
    }

    if (hasBody) {
        code += `  body: JSON.stringify(${JSON.stringify(cleanBody, null, 2).split('\n').join('\n  ')})\n`;
    }

    code += `});\n\n`;
    code += `const data = await response.json();\n`;
    code += `console.log(data);`;

    return code;
}

/**
 * API request state interface for reactive forms
 */
export interface ApiRequestState {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint: string;
    apiKey: string;
    body: Record<string, any>;
}
