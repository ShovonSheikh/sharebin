/**
 * Pastely API Client
 * 
 * Centralized API client for all paste operations.
 * Uses the versioned endpoint structure: /api/v1/{action}
 */

const API_BASE = '/api/v1';

export type ApiAction = 'create' | 'get' | 'list' | 'delete';

export interface CreatePasteRequest {
    content: string;
    title?: string;
    syntax?: string;
    expiration?: string;
    password?: string;
    burn_after_read?: boolean;
}

export interface PasteResponse {
    paste_id: string;
    paste_content?: string;
    paste_type: string;
    title?: string;
    expires_at?: string;
    created_at: string;
    views?: number;
    protected?: boolean;
    burned?: boolean;
    burn_after_read?: boolean;
}

export interface CreatePasteResponse {
    paste_id: string;
    url: string;
    protected: boolean;
    burn_after_read: boolean;
}

export interface ListPastesResponse {
    pastes: PasteResponse[];
}

export interface ApiError {
    error: string;
    message?: string;
}

interface ApiCallOptions {
    method?: 'GET' | 'POST' | 'DELETE';
    body?: Record<string, any>;
    params?: Record<string, string>;
    apiKey?: string;
}

/**
 * Make an API call to the Pastely backend
 */
export async function apiCall<T>(
    action: ApiAction,
    options: ApiCallOptions = {}
): Promise<T> {
    const { method = 'GET', body, params, apiKey } = options;

    const url = new URL(`${window.location.origin}${API_BASE}/${action}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }

    const headers: Record<string, string> = {};
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }
    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data as T;
}

/**
 * Create a new paste
 */
export async function createPaste(
    request: CreatePasteRequest,
    apiKey?: string
): Promise<CreatePasteResponse> {
    return apiCall<CreatePasteResponse>('create', {
        method: 'POST',
        body: request,
        apiKey,
    });
}

/**
 * Get a paste by ID
 */
export async function getPaste(
    pasteId: string,
    password?: string
): Promise<PasteResponse> {
    if (password) {
        return apiCall<PasteResponse>('get', {
            method: 'POST',
            params: { id: pasteId, verify: '1' },
            body: { password },
        });
    }

    return apiCall<PasteResponse>('get', {
        params: { id: pasteId },
    });
}

/**
 * List all pastes for the authenticated user
 */
export async function listPastes(apiKey: string): Promise<ListPastesResponse> {
    return apiCall<ListPastesResponse>('list', {
        apiKey,
    });
}

/**
 * Delete a paste
 */
export async function deletePaste(
    pasteId: string,
    apiKey: string
): Promise<{ message: string }> {
    return apiCall<{ message: string }>('delete', {
        method: 'DELETE',
        params: { id: pasteId },
        apiKey,
    });
}
