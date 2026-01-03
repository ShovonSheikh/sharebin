import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateShareRequest {
  content: string;
  title?: string;
  syntax?: string;
  expiration?: string;
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

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserIdFromApiKey(supabase: any, authHeader: string): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const apiKey = authHeader.replace("Bearer ", "").trim();
  if (!apiKey.startsWith("ts_")) {
    return null;
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
    return null;
  }

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", keyHash);

  return data.user_id;
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

  try {
    if (req.method === "GET") {
      const shareId = url.searchParams.get("id");

      if (shareId) {
        const { data, error } = await supabase
          .from("shares")
          .select("id, content, title, syntax, expires_at, created_at, views")
          .eq("id", shareId)
          .maybeSingle();

        if (error || !data) {
          return new Response(JSON.stringify({ error: "Share not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          return new Response(JSON.stringify({ error: "Share has expired" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        const userId = await getUserIdFromApiKey(supabase, authHeader);
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data } = await supabase.from("shares").select("id, title, syntax, expires_at, created_at, views").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
        return new Response(JSON.stringify({ shares: data || [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (req.method === "POST") {
      const body: CreateShareRequest = await req.json();
      if (!body.content?.trim()) {
        return new Response(JSON.stringify({ error: "Content is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const userId = await getUserIdFromApiKey(supabase, authHeader);
      const expiresAt = body.expiration ? getExpirationDate(body.expiration) : null;

      const { data, error } = await supabase.from("shares").insert({ content: body.content.trim(), title: body.title?.trim() || null, syntax: body.syntax || "plaintext", expires_at: expiresAt?.toISOString() || null, user_id: userId }).select("id").single();

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to create share" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ id: data.id, url: `${url.origin.replace("/functions/v1", "")}/s/${data.id}` }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "DELETE") {
      const shareId = url.searchParams.get("id");
      if (!shareId) {
        return new Response(JSON.stringify({ error: "Share ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const userId = await getUserIdFromApiKey(supabase, authHeader);
      if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: share } = await supabase.from("shares").select("user_id").eq("id", shareId).maybeSingle();
      if (!share || share.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabase.from("shares").delete().eq("id", shareId);
      return new Response(JSON.stringify({ message: "Deleted" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});