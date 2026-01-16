import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

interface ClerkUser {
  id: string;
  email_addresses: Array<{ email_address: string; id: string }>;
  primary_email_address_id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  public_metadata?: {
    subscription_tier?: 'free' | 'pro' | 'business';
  };
}

interface WebhookEvent {
  type: string;
  data: ClerkUser;
}

async function verifyWebhookSignature(
  payload: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
  secret: string
): Promise<boolean> {
  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Simple signature verification
  // In production, use the @svix/webhooks library
  const encoder = new TextEncoder();
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  
  // Extract the base64 secret (remove "whsec_" prefix if present)
  const secretKey = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  
  try {
    // Decode base64 secret
    const secretBytes = Uint8Array.from(atob(secretKey), c => c.charCodeAt(0));
    
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedContent)
    );
    
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    
    // Svix sends multiple signatures separated by spaces
    const signatures = svixSignature.split(' ');
    for (const sig of signatures) {
      const [version, signature] = sig.split(',');
      if (version === 'v1' && signature === computedSignature) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Svix headers for signature verification
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    // Get raw body for signature verification
    const payload = await req.text();
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(
      payload,
      svixId,
      svixTimestamp,
      svixSignature,
      webhookSecret
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event: WebhookEvent = JSON.parse(payload);
    const { type, data: user } = event;

    console.log(`Processing Clerk webhook: ${type} for user ${user.id}`);

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get primary email
    const primaryEmail = user.email_addresses.find(
      email => email.id === user.primary_email_address_id
    )?.email_address;

    switch (type) {
      case 'user.created': {
        console.log(`Creating profile for Clerk user: ${user.id}`);
        
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(), // Generate new UUID for profile
            clerk_user_id: user.id,
            email: primaryEmail,
            first_name: user.first_name,
            last_name: user.last_name,
            image_url: user.image_url,
            subscription_tier: user.public_metadata?.subscription_tier || 'free',
            storage_used: 0,
          });

        if (error) {
          console.error('Error creating profile:', error);
          throw error;
        }
        
        console.log(`Profile created for user: ${user.id}`);
        break;
      }

      case 'user.updated': {
        console.log(`Updating profile for Clerk user: ${user.id}`);
        
        const { error } = await supabase
          .from('profiles')
          .update({
            email: primaryEmail,
            first_name: user.first_name,
            last_name: user.last_name,
            image_url: user.image_url,
            subscription_tier: user.public_metadata?.subscription_tier || 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
        
        console.log(`Profile updated for user: ${user.id}`);
        break;
      }

      case 'user.deleted': {
        console.log(`Deleting data for Clerk user: ${user.id}`);
        
        // First get the profile to find the internal ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_user_id', user.id)
          .single();

        if (profile) {
          // Delete user's shares
          const { error: sharesError } = await supabase
            .from('shares')
            .delete()
            .eq('user_id', profile.id);

          if (sharesError) {
            console.error('Error deleting user shares:', sharesError);
          }

          // Delete user's API keys
          const { error: apiKeysError } = await supabase
            .from('api_keys')
            .delete()
            .eq('user_id', profile.id);

          if (apiKeysError) {
            console.error('Error deleting user API keys:', apiKeysError);
          }

          // Delete the profile
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('clerk_user_id', user.id);

          if (profileError) {
            console.error('Error deleting profile:', profileError);
            throw profileError;
          }
        }
        
        console.log(`All data deleted for user: ${user.id}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: true, type }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
