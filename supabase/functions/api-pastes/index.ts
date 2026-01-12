import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration
const RATE_LIMIT_PER_MINUTE = 60;
const RATE_LIMIT_PER_HOUR = 1000;

interface CreatePasteRequest {
    content: string;
    title?: string;
    syntax?: string;
    expiration?: string;
    password?: string;
    burn_after_read?: boolean;
}

interface VerifyPasswordRequest {
    password: string;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    reset: number;
    limit: number;
}

function getExpirationDate(expiration: string): Date | null {
    const now = new Date();
    switch (expiration) {
        case "1d":
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        case "1w":
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        case "1m":
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        case "3m":
            return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        default:
            return null;
    }
}

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashApiKey(key: string): Promise<string> {
    return hashPassword(key);
}

// Rate limiting function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkRateLimit(supabase: any, apiKeyHash: string): Promise<RateLimitResult> {
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setSeconds(0, 0); // Round to current minute

    try {
        // Check current minute's count
        const { data: existing } = await supabase
            .from("api_rate_limits")
            .select("request_count")
            .eq("api_key_hash", apiKeyHash)
            .eq("window_start", windowStart.toISOString())
            .maybeSingle();

        const currentCount = existing?.request_count || 0;

        if (currentCount >= RATE_LIMIT_PER_MINUTE) {
            const reset = 60 - now.getSeconds();
            return { allowed: false, remaining: 0, reset, limit: RATE_LIMIT_PER_MINUTE };
        }

        // Check hourly limit
        const hourStart = new Date(now);
        hourStart.setMinutes(0, 0, 0);

        const { data: hourlyData } = await supabase
            .from("api_rate_limits")
            .select("request_count")
            .eq("api_key_hash", apiKeyHash)
            .gte("window_start", hourStart.toISOString());

        const hourlyCount = (hourlyData || []).reduce((sum: number, row: { request_count: number }) => sum + row.request_count, 0);

        if (hourlyCount >= RATE_LIMIT_PER_HOUR) {
            const reset = (60 - now.getMinutes()) * 60;
            return { allowed: false, remaining: 0, reset, limit: RATE_LIMIT_PER_HOUR };
        }

        // Upsert the counter
        if (existing) {
            await supabase
                .from("api_rate_limits")
                .update({ request_count: currentCount + 1 })
                .eq("api_key_hash", apiKeyHash)
                .eq("window_start", windowStart.toISOString());
        } else {
            await supabase
                .from("api_rate_limits")
                .insert({
                    api_key_hash: apiKeyHash,
                    window_start: windowStart.toISOString(),
                    request_count: 1
                });
        }

        // Cleanup old records occasionally (1% chance per request)
        if (Math.random() < 0.01) {
            await supabase.rpc("cleanup_old_rate_limits").catch(() => { });
        }

        return {
            allowed: true,
            remaining: RATE_LIMIT_PER_MINUTE - currentCount - 1,
            reset: 60 - now.getSeconds(),
            limit: RATE_LIMIT_PER_MINUTE
        };
    } catch (error) {
        console.error("Rate limit check error:", error);
        // Allow request on error to avoid blocking
        return { allowed: true, remaining: RATE_LIMIT_PER_MINUTE, reset: 60, limit: RATE_LIMIT_PER_MINUTE };
    }
}

// Helper to add rate limit headers
function addRateLimitHeaders(headers: Record<string, string>, rateLimit: RateLimitResult): Record<string, string> {
    return {
        ...headers,
        "X-RateLimit-Limit": rateLimit.limit.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": rateLimit.reset.toString(),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserIdFromApiKey(supabase: any, authHeader: string): Promise<{ userId: string | null; keyHash: string | null }> {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { userId: null, keyHash: null };
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();
    // Support both old 'ts_' prefix and new 'op_' prefix for backward compatibility
    if (!apiKey.startsWith("op_") && !apiKey.startsWith("ts_")) {
        return { userId: null, keyHash: null };
    }

    const keyHash = await hashApiKey(apiKey);

    const { data, error } = await supabase
        .from("api_keys")
        .select("user_id")
        .eq("key_hash", keyHash)
        .eq("is_active", true)
        .maybeSingle();

    if (error || !data) {
        console.log("API key lookup failed:", error?.message);
        return { userId: null, keyHash: null };
    }

    // Update last_used_at
    await supabase
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("key_hash", keyHash);

    return { userId: data.user_id, keyHash };
}

// Determine action from URL path
function getActionFromUrl(url: URL): string {
    const pathname = url.pathname;
    const parts = pathname.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];

    if (lastPart === 'create') return 'create';
    if (lastPart === 'get') return 'get';
    if (lastPart === 'list') return 'list';
    if (lastPart === 'delete') return 'delete';
    if (lastPart === 'raw') return 'raw';
    if (lastPart === 'img') return 'img';

    return 'auto';
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const authHeader = req.headers.get("Authorization") || "";
    const action = getActionFromUrl(url);

    // Skip auth check for public endpoints
    const publicEndpoints = ['img', 'raw', 'get'];
    const requiresAuth = !publicEndpoints.includes(action);

    try {
        // ============================================
        // ACTION: IMG (raw image data)
        // ============================================
        if (req.method === "GET" && action === 'img') {
            const pasteId = url.searchParams.get("id");
            if (!pasteId) {
                return new Response("Image ID required", {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            const { data, error } = await supabase
                .from("shares")
                .select("file_path, file_type, password_hash, expires_at, burn_after_read, views")
                .eq("id", pasteId)
                .maybeSingle();

            if (error || !data) {
                return new Response("Image not found", {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            // Check expiration
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                return new Response("Image has expired", {
                    status: 410,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            // Password protected images cannot be accessed via raw endpoint
            if (data.password_hash) {
                return new Response("Password protected images cannot be accessed via /img endpoint", {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            // Check if this is actually a file upload with an image
            if (!data.file_path) {
                return new Response("No image file associated with this ID", {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            // Get the public URL instead of downloading
            const { data: urlData } = supabase.storage
                .from("uploads")
                .getPublicUrl(data.file_path);

            if (!urlData?.publicUrl) {
                return new Response("Failed to get image URL", {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            // Fetch the image from the public URL
            const imageResponse = await fetch(urlData.publicUrl);

            if (!imageResponse.ok) {
                return new Response("Failed to retrieve image", {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            // Get the image as array buffer
            const imageBuffer = await imageResponse.arrayBuffer();

            // Handle burn after read
            if (data.burn_after_read) {
                await supabase.storage.from("uploads").remove([data.file_path]);
                await supabase.from("shares").delete().eq("id", pasteId);
                console.log(`Image ${pasteId} burned after raw read`);
            } else {
                // Update view count
                await supabase
                    .from("shares")
                    .update({ views: (data.views || 0) + 1 })
                    .eq("id", pasteId);
            }

            // Determine content type
            const contentType = data.file_type || imageResponse.headers.get("content-type") || "application/octet-stream";

            return new Response(imageBuffer, {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=31536000, immutable",
                }
            });
        }

        // ============================================
        // ACTION: RAW (plain text content)
        // ============================================
        if (req.method === "GET" && action === 'raw') {
            const pasteId = url.searchParams.get("id");
            if (!pasteId) {
                return new Response("Paste ID required", {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            const { data, error } = await supabase
                .from("shares")
                .select("content, password_hash, expires_at, burn_after_read, views")
                .eq("id", pasteId)
                .maybeSingle();

            if (error || !data) {
                return new Response("Paste not found", {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            // Check expiration
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                return new Response("Paste has expired", {
                    status: 410,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            // Password protected pastes cannot be accessed via raw endpoint
            if (data.password_hash) {
                return new Response("Password protected pastes cannot be accessed via /raw endpoint", {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" }
                });
            }

            // Handle burn after read
            if (data.burn_after_read) {
                await supabase.from("shares").delete().eq("id", pasteId);
                console.log(`Paste ${pasteId} burned after raw read`);
            } else {
                // Update view count
                await supabase
                    .from("shares")
                    .update({ views: (data.views || 0) + 1 })
                    .eq("id", pasteId);
            }

            return new Response(data.content, {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" }
            });
        }

        // ============================================
        // ACTION: GET (with password verification)
        // ============================================
        if (req.method === "POST" && url.searchParams.get("verify")) {
            const pasteId = url.searchParams.get("id");
            if (!pasteId) {
                return new Response(JSON.stringify({ error: "Paste ID required" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const body: VerifyPasswordRequest = await req.json();
            if (!body.password) {
                return new Response(JSON.stringify({ error: "Password required" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const { data: paste, error } = await supabase
                .from("shares")
                .select("id, content, title, syntax, expires_at, created_at, views, password_hash, burn_after_read, file_path, file_name, file_size, file_type, content_type")
                .eq("id", pasteId)
                .maybeSingle();

            if (error || !paste) {
                return new Response(JSON.stringify({ error: "Paste not found" }), {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
                return new Response(JSON.stringify({ error: "Paste has expired" }), {
                    status: 410,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const providedHash = await hashPassword(body.password);
            if (providedHash !== paste.password_hash) {
                return new Response(JSON.stringify({ error: "Invalid password" }), {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            if (paste.burn_after_read) {
                await supabase.from("shares").delete().eq("id", pasteId);
                console.log(`Paste ${pasteId} burned after read`);
            } else {
                await supabase
                    .from("shares")
                    .update({ views: (paste.views || 0) + 1 })
                    .eq("id", pasteId);
            }

            return new Response(JSON.stringify({
                paste_id: paste.id,
                paste_content: paste.content,
                paste_type: paste.syntax,
                title: paste.title,
                expires_at: paste.expires_at,
                created_at: paste.created_at,
                views: paste.views,
                burned: paste.burn_after_read,
                // File upload fields
                file_path: paste.file_path,
                file_name: paste.file_name,
                file_size: paste.file_size,
                file_type: paste.file_type,
                content_type: paste.content_type,
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // ============================================
        // ACTION: GET (retrieve paste or list pastes)
        // ============================================
        if (req.method === "GET" && (action === 'get' || action === 'list' || action === 'auto')) {
            const pasteId = url.searchParams.get("id");

            if (pasteId || action === 'get') {
                if (!pasteId) {
                    return new Response(JSON.stringify({ error: "Paste ID required" }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                const { data, error } = await supabase
                    .from("shares")
                    .select("id, content, title, syntax, expires_at, created_at, views, password_hash, burn_after_read")
                    .eq("id", pasteId)
                    .maybeSingle();

                if (error || !data) {
                    return new Response(JSON.stringify({ error: "Paste not found" }), {
                        status: 404,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                if (data.expires_at && new Date(data.expires_at) < new Date()) {
                    return new Response(JSON.stringify({ error: "Paste has expired" }), {
                        status: 410,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                if (data.password_hash) {
                    return new Response(JSON.stringify({
                        paste_id: data.id,
                        title: data.title,
                        paste_type: data.syntax,
                        expires_at: data.expires_at,
                        created_at: data.created_at,
                        protected: true,
                        burn_after_read: data.burn_after_read
                    }), {
                        status: 200,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                if (data.burn_after_read) {
                    await supabase.from("shares").delete().eq("id", pasteId);
                    console.log(`Paste ${pasteId} burned after read`);

                    return new Response(JSON.stringify({
                        paste_id: data.id,
                        paste_content: data.content,
                        paste_type: data.syntax,
                        title: data.title,
                        expires_at: data.expires_at,
                        created_at: data.created_at,
                        views: data.views,
                        burned: true
                    }), {
                        status: 200,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                await supabase
                    .from("shares")
                    .update({ views: (data.views || 0) + 1 })
                    .eq("id", pasteId);

                return new Response(JSON.stringify({
                    paste_id: data.id,
                    paste_content: data.content,
                    paste_type: data.syntax,
                    title: data.title,
                    expires_at: data.expires_at,
                    created_at: data.created_at,
                    views: data.views
                }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // List pastes (requires auth with rate limiting)
            if (action === 'list' || !pasteId) {
                const { userId, keyHash } = await getUserIdFromApiKey(supabase, authHeader);
                if (!userId || !keyHash) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), {
                        status: 401,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                // Check rate limit
                const rateLimit = await checkRateLimit(supabase, keyHash);
                if (!rateLimit.allowed) {
                    return new Response(JSON.stringify({
                        error: "Rate limit exceeded",
                        retry_after: rateLimit.reset
                    }), {
                        status: 429,
                        headers: addRateLimitHeaders({ ...corsHeaders, "Content-Type": "application/json" }, rateLimit)
                    });
                }

                const { data } = await supabase
                    .from("shares")
                    .select("id, title, syntax, expires_at, created_at, views, burn_after_read")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false })
                    .limit(100);

                const pastes = (data || []).map(item => ({
                    paste_id: item.id,
                    title: item.title,
                    paste_type: item.syntax,
                    expires_at: item.expires_at,
                    created_at: item.created_at,
                    views: item.views,
                    burn_after_read: item.burn_after_read
                }));

                return new Response(JSON.stringify({ pastes }), {
                    status: 200,
                    headers: addRateLimitHeaders({ ...corsHeaders, "Content-Type": "application/json" }, rateLimit)
                });
            }
        }

        // ============================================
        // ACTION: CREATE (new paste with rate limiting)
        // ============================================
        if (req.method === "POST" && (action === 'create' || action === 'auto')) {
            let body: CreatePasteRequest;
            try {
                body = await req.json();
            } catch (parseError) {
                console.error("JSON parse error:", parseError);
                return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            if (!body.content?.trim()) {
                return new Response(JSON.stringify({ error: "Content is required" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const { userId, keyHash } = await getUserIdFromApiKey(supabase, authHeader);
            if (!userId || !keyHash) {
                return new Response(JSON.stringify({
                    error: "Unauthorized",
                    message: "Valid API key required. Get one from your dashboard."
                }), {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // Check rate limit
            const rateLimit = await checkRateLimit(supabase, keyHash);
            if (!rateLimit.allowed) {
                return new Response(JSON.stringify({
                    error: "Rate limit exceeded",
                    retry_after: rateLimit.reset
                }), {
                    status: 429,
                    headers: addRateLimitHeaders({ ...corsHeaders, "Content-Type": "application/json" }, rateLimit)
                });
            }

            const expiresAt = body.expiration ? getExpirationDate(body.expiration) : null;
            const passwordHash = body.password ? await hashPassword(body.password) : null;

            const { data, error } = await supabase
                .from("shares")
                .insert({
                    content: body.content.trim(),
                    title: body.title?.trim() || null,
                    syntax: body.syntax || "plaintext",
                    expires_at: expiresAt?.toISOString() || null,
                    user_id: userId,
                    password_hash: passwordHash,
                    burn_after_read: body.burn_after_read || false
                })
                .select("id")
                .single();

            if (error) {
                console.error("Error creating paste:", error);
                return new Response(JSON.stringify({ error: "Failed to create paste" }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const siteUrl = "https://pastely.app";

            return new Response(JSON.stringify({
                paste_id: data.id,
                url: `${siteUrl}/p/${data.id}`,
                protected: !!passwordHash,
                burn_after_read: body.burn_after_read || false
            }), {
                status: 201,
                headers: addRateLimitHeaders({ ...corsHeaders, "Content-Type": "application/json" }, rateLimit)
            });
        }

        // ============================================
        // ACTION: DELETE (remove paste with rate limiting)
        // ============================================
        if (req.method === "DELETE" && (action === 'delete' || action === 'auto')) {
            const pasteId = url.searchParams.get("id");
            if (!pasteId) {
                return new Response(JSON.stringify({ error: "Paste ID required" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const { userId, keyHash } = await getUserIdFromApiKey(supabase, authHeader);
            if (!userId || !keyHash) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // Check rate limit
            const rateLimit = await checkRateLimit(supabase, keyHash);
            if (!rateLimit.allowed) {
                return new Response(JSON.stringify({
                    error: "Rate limit exceeded",
                    retry_after: rateLimit.reset
                }), {
                    status: 429,
                    headers: addRateLimitHeaders({ ...corsHeaders, "Content-Type": "application/json" }, rateLimit)
                });
            }

            const { data: paste } = await supabase
                .from("shares")
                .select("user_id")
                .eq("id", pasteId)
                .maybeSingle();

            if (!paste || paste.user_id !== userId) {
                return new Response(JSON.stringify({ error: "Forbidden" }), {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            await supabase.from("shares").delete().eq("id", pasteId);
            return new Response(JSON.stringify({ message: "Paste deleted successfully" }), {
                status: 200,
                headers: addRateLimitHeaders({ ...corsHeaders, "Content-Type": "application/json" }, rateLimit)
            });
        }

        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
