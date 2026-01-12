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
 * Generate Python requests code from request options
 */
export function generatePython(options: CurlOptions): string {
    const { method, url, apiKey, body } = options;

    const fetchHeaders: Record<string, string> = {};

    if (apiKey) {
        fetchHeaders['Authorization'] = `Bearer ${apiKey}`;
    }

    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        fetchHeaders['Content-Type'] = 'application/json';
    }

    // Filter out undefined values from body
    const cleanBody = body ? Object.fromEntries(
        Object.entries(body).filter(([_, v]) => v !== undefined && v !== '')
    ) : null;

    const hasBody = cleanBody && Object.keys(cleanBody).length > 0;

    let code = `import requests\n\n`;
    code += `response = requests.${method.toLowerCase()}(\n`;
    code += `    "${url}",\n`;

    if (Object.keys(fetchHeaders).length > 0) {
        code += `    headers=${JSON.stringify(fetchHeaders, null, 4).replace(/"/g, '"').split('\n').join('\n    ')},\n`;
    }

    if (hasBody) {
        code += `    json=${JSON.stringify(cleanBody, null, 4).split('\n').join('\n    ')}\n`;
    }

    code += `)\n\n`;
    code += `data = response.json()\n`;
    code += `print(data)`;

    return code;
}

/**
 * Generate Go net/http code from request options
 */
export function generateGo(options: CurlOptions): string {
    const { method, url, apiKey, body } = options;

    // Filter out undefined values from body
    const cleanBody = body ? Object.fromEntries(
        Object.entries(body).filter(([_, v]) => v !== undefined && v !== '')
    ) : null;

    const hasBody = cleanBody && Object.keys(cleanBody).length > 0;

    let code = `package main\n\n`;
    code += `import (\n`;
    code += `    "bytes"\n`;
    code += `    "encoding/json"\n`;
    code += `    "fmt"\n`;
    code += `    "io"\n`;
    code += `    "net/http"\n`;
    code += `)\n\n`;
    code += `func main() {\n`;

    if (hasBody) {
        code += `    body, _ := json.Marshal(map[string]interface{}{\n`;
        Object.entries(cleanBody!).forEach(([key, value]) => {
            const valStr = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
            code += `        "${key}": ${valStr},\n`;
        });
        code += `    })\n\n`;
        code += `    req, _ := http.NewRequest("${method}", "${url}", bytes.NewBuffer(body))\n`;
    } else {
        code += `    req, _ := http.NewRequest("${method}", "${url}", nil)\n`;
    }

    if (apiKey) {
        code += `    req.Header.Set("Authorization", "Bearer ${apiKey}")\n`;
    }
    if (hasBody) {
        code += `    req.Header.Set("Content-Type", "application/json")\n`;
    }

    code += `\n`;
    code += `    client := &http.Client{}\n`;
    code += `    resp, _ := client.Do(req)\n`;
    code += `    defer resp.Body.Close()\n\n`;
    code += `    respBody, _ := io.ReadAll(resp.Body)\n`;
    code += `    fmt.Println(string(respBody))\n`;
    code += `}`;

    return code;
}

/**
 * Generate PHP cURL code from request options
 */
export function generatePHP(options: CurlOptions): string {
    const { method, url, apiKey, body } = options;

    // Filter out undefined values from body
    const cleanBody = body ? Object.fromEntries(
        Object.entries(body).filter(([_, v]) => v !== undefined && v !== '')
    ) : null;

    const hasBody = cleanBody && Object.keys(cleanBody).length > 0;

    let code = `<?php\n\n`;
    code += `$ch = curl_init();\n\n`;
    code += `curl_setopt($ch, CURLOPT_URL, "${url}");\n`;
    code += `curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n`;

    if (method !== 'GET') {
        code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");\n`;
    }

    const headers: string[] = [];
    if (apiKey) {
        headers.push(`"Authorization: Bearer ${apiKey}"`);
    }
    if (hasBody) {
        headers.push(`"Content-Type: application/json"`);
    }

    if (headers.length > 0) {
        code += `curl_setopt($ch, CURLOPT_HTTPHEADER, [\n`;
        headers.forEach((h, i) => {
            code += `    ${h}${i < headers.length - 1 ? ',' : ''}\n`;
        });
        code += `]);\n`;
    }

    if (hasBody) {
        code += `curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${JSON.stringify(cleanBody, null, 4).split('\n').join('\n')}));\n`;
    }

    code += `\n`;
    code += `$response = curl_exec($ch);\n`;
    code += `curl_close($ch);\n\n`;
    code += `$data = json_decode($response, true);\n`;
    code += `print_r($data);\n`;
    code += `?>`;

    return code;
}

/**
 * Generate Ruby net/http code from request options
 */
export function generateRuby(options: CurlOptions): string {
    const { method, url, apiKey, body } = options;

    // Filter out undefined values from body
    const cleanBody = body ? Object.fromEntries(
        Object.entries(body).filter(([_, v]) => v !== undefined && v !== '')
    ) : null;

    const hasBody = cleanBody && Object.keys(cleanBody).length > 0;

    let code = `require 'net/http'\n`;
    code += `require 'json'\n`;
    code += `require 'uri'\n\n`;

    code += `uri = URI.parse("${url}")\n`;
    code += `http = Net::HTTP.new(uri.host, uri.port)\n`;
    code += `http.use_ssl = true\n\n`;

    const methodClass = method === 'GET' ? 'Get' : 
                        method === 'POST' ? 'Post' : 
                        method === 'DELETE' ? 'Delete' : 
                        method === 'PUT' ? 'Put' : 'Patch';

    code += `request = Net::HTTP::${methodClass}.new(uri.request_uri)\n`;

    if (apiKey) {
        code += `request["Authorization"] = "Bearer ${apiKey}"\n`;
    }
    if (hasBody) {
        code += `request["Content-Type"] = "application/json"\n`;
        code += `request.body = ${JSON.stringify(cleanBody, null, 2).split('\n').join('\n')}.to_json\n`;
    }

    code += `\n`;
    code += `response = http.request(request)\n`;
    code += `data = JSON.parse(response.body)\n`;
    code += `puts data`;

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
