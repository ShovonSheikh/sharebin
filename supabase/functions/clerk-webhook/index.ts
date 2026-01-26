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

interface ClerkSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
}

interface WebhookEvent {
  type: string;
  data: ClerkUser | ClerkSubscription;
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

// Map Clerk plan IDs to subscription tiers
function mapPlanToTier(planId: string): 'free' | 'pro' | 'business' {
  // Map your Clerk Billing plan IDs to tiers
  // You'll need to update these with your actual Clerk plan IDs
  const planMapping: Record<string, 'pro' | 'business'> = {
    // Example: 'plan_xxx': 'pro',
    // 'plan_yyy': 'business',
  };
  
  return planMapping[planId] || 'free';
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
    const { type, data } = event;

    console.log(`Processing Clerk webhook: ${type}`);

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (type) {
      case 'user.created': {
        const user = data as ClerkUser;
        console.log(`Creating profile for Clerk user: ${user.id}`);
        
        // Get primary email
        const primaryEmail = user.email_addresses.find(
          email => email.id === user.primary_email_address_id
        )?.email_address;
        
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
        const user = data as ClerkUser;
        console.log(`Updating profile for Clerk user: ${user.id}`);
        
        // Get primary email
        const primaryEmail = user.email_addresses.find(
          email => email.id === user.primary_email_address_id
        )?.email_address;
        
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
        const user = data as ClerkUser;
        console.log(`Deleting data for Clerk user: ${user.id}`);
        
        // Delete user's shares using Clerk ID directly
        // (user_id column in shares now stores Clerk IDs as TEXT)
        const { error: sharesError } = await supabase
          .from('shares')
          .delete()
          .eq('user_id', user.id);

        if (sharesError) {
          console.error('Error deleting user shares:', sharesError);
        }

        // Delete user's API keys using Clerk ID directly
        const { error: apiKeysError } = await supabase
          .from('api_keys')
          .delete()
          .eq('user_id', user.id);

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
        
        console.log(`All data deleted for Clerk user: ${user.id}`);
        break;
      }

      // Clerk Billing subscription events
      case 'subscription.created':
      case 'subscription.updated': {
        const subscription = data as ClerkSubscription;
        console.log(`Subscription ${type} for user: ${subscription.user_id}`);
        
        // Map plan ID to tier
        const tier = mapPlanToTier(subscription.plan_id);
        
        // Update user's subscription tier
        const { error } = await supabase
          .from('profiles')
          .update({ 
            subscription_tier: tier,
            clerk_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', subscription.user_id);

        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
        
        console.log(`Subscription updated for user ${subscription.user_id}: ${tier}`);
        break;
      }

      case 'subscription.deleted': {
        const subscription = data as ClerkSubscription;
        console.log(`Subscription cancelled for user: ${subscription.user_id}`);
        
        // Downgrade to free tier
        const { error } = await supabase
          .from('profiles')
          .update({ 
            subscription_tier: 'free',
            clerk_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', subscription.user_id);

        if (error) {
          console.error('Error cancelling subscription:', error);
          throw error;
        }
        
        console.log(`Subscription cancelled for user ${subscription.user_id}`);
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
