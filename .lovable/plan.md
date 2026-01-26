
# Pre-Public Release Implementation Plan

## Overview

This plan addresses all critical gaps identified before making the application public with tiered subscriptions. The implementation will ensure security, proper billing, and complete feature functionality.

---

## Summary of Issues and Solutions

| Issue | Priority | Solution |
|-------|----------|----------|
| RLS policies too permissive | Critical | Add ownership verification in RLS policies |
| `storage_used` not tracking | High | Increment on upload, decrement on delete |
| API bypasses tier limits | High | Add tier validation in edge function |
| Clerk webhook deletion bug | Medium | Fix to use `clerk_user_id` correctly |
| No payment integration | High | Integrate Stripe for subscriptions |
| No subscription UI | Medium | Create subscription management page |
| Frontend delete missing ownership check | Medium | Add `user_id` verification before delete |

---

## Part 1: Fix RLS Policies (Security)

### Problem
Current RLS policies use `USING (true)` for UPDATE and DELETE, allowing any authenticated user to modify or delete any record.

### Solution
Update RLS policies to verify ownership using the `user_id` column.

### Database Migration

```sql
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Owner can delete shares" ON shares;
DROP POLICY IF EXISTS "Owner can update shares" ON shares;
DROP POLICY IF EXISTS "Anyone can delete API keys" ON api_keys;
DROP POLICY IF EXISTS "Anyone can update API keys" ON api_keys;

-- Create ownership-based policies for shares
CREATE POLICY "Owner can delete own shares"
  ON shares FOR DELETE
  USING (user_id IS NOT NULL AND user_id = current_setting('request.headers')::json->>'x-clerk-user-id');

CREATE POLICY "Owner can update own shares"
  ON shares FOR UPDATE
  USING (user_id IS NOT NULL AND user_id = current_setting('request.headers')::json->>'x-clerk-user-id');

-- Create ownership-based policies for api_keys
CREATE POLICY "Owner can delete own API keys"
  ON api_keys FOR DELETE
  USING (user_id IS NOT NULL AND user_id = current_setting('request.headers')::json->>'x-clerk-user-id');

CREATE POLICY "Owner can update own API keys"
  ON api_keys FOR UPDATE
  USING (user_id IS NOT NULL AND user_id = current_setting('request.headers')::json->>'x-clerk-user-id');
```

**Alternative Approach (Recommended):**
Since Clerk doesn't integrate with Supabase RLS directly, we'll handle ownership verification in the application layer and edge functions, keeping the database policies simple but adding explicit ownership checks in code.

### Frontend Ownership Verification

**Files to modify:**
- `src/components/dashboard/UserPastes.tsx` - Add ownership check before delete
- `src/components/dashboard/ApiKeyManager.tsx` - Add ownership check before delete
- `src/components/dashboard/ImageGallery.tsx` - Add ownership check before delete

```typescript
// Add to delete functions
const deletePaste = async (pasteId: string) => {
  // Verify ownership before deleting
  const { data: paste } = await supabase
    .from('shares')
    .select('user_id')
    .eq('id', pasteId)
    .single();
    
  if (paste?.user_id !== user?.id) {
    toast.error('You do not have permission to delete this paste');
    return;
  }
  
  // Proceed with deletion...
};
```

---

## Part 2: Storage Tracking

### Problem
`storage_used` in the `profiles` table is never updated when files are uploaded or deleted.

### Solution
Create helper functions and update all upload/delete locations.

### Create Storage Update Function (Edge Function Helper)

```typescript
// Add to api-pastes/index.ts and create utility

async function updateStorageUsed(
  supabase: any, 
  clerkUserId: string, 
  sizeChange: number
): Promise<void> {
  // Get current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, storage_used')
    .eq('clerk_user_id', clerkUserId)
    .single();
    
  if (profile) {
    const newStorageUsed = Math.max(0, (profile.storage_used || 0) + sizeChange);
    await supabase
      .from('profiles')
      .update({ storage_used: newStorageUsed })
      .eq('id', profile.id);
  }
}
```

### Files to Modify

1. **`src/components/upload/FileUploadForm.tsx`**
   - After successful upload, increment `storage_used`
   
   ```typescript
   // After successful insert
   if (user?.id && uploadedFile) {
     const { data: profile } = await supabase
       .from('profiles')
       .select('id, storage_used')
       .eq('clerk_user_id', user.id)
       .single();
       
     if (profile) {
       await supabase
         .from('profiles')
         .update({ storage_used: (profile.storage_used || 0) + uploadedFile.file.size })
         .eq('id', profile.id);
     }
   }
   ```

2. **`src/components/dashboard/ImageGallery.tsx`**
   - On delete, decrement `storage_used`

3. **`src/pages/ViewPaste.tsx`** (burn-after-read)
   - On burn, decrement `storage_used`

4. **`supabase/functions/api-pastes/index.ts`**
   - On burn-after-read and delete actions, decrement `storage_used`

---

## Part 3: API Tier Enforcement

### Problem
The `api-pastes` edge function doesn't enforce tier limits when creating pastes via API.

### Solution
Add tier limit checking to the create action in the edge function.

### Modify `supabase/functions/api-pastes/index.ts`

```typescript
// Add tier limits constant
const TIER_LIMITS = {
  free: {
    maxPasteSize: 10 * 1024 * 1024,     // 10 MB
    totalStorage: 500 * 1024 * 1024,    // 500 MB
  },
  pro: {
    maxPasteSize: 25 * 1024 * 1024,     // 25 MB
    totalStorage: 10 * 1024 * 1024 * 1024, // 10 GB
  },
  business: {
    maxPasteSize: 50 * 1024 * 1024,     // 50 MB
    totalStorage: Infinity,
  },
};

// In CREATE action, after getting userId:
async function getUserTierAndStorage(supabase: any, clerkUserId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier, storage_used')
    .eq('clerk_user_id', clerkUserId)
    .single();
    
  return {
    tier: data?.subscription_tier || 'free',
    storageUsed: data?.storage_used || 0,
  };
}

// Then validate:
const { tier, storageUsed } = await getUserTierAndStorage(supabase, userId);
const limits = TIER_LIMITS[tier];
const contentSize = new TextEncoder().encode(body.content).length;

if (contentSize > limits.maxPasteSize) {
  return new Response(JSON.stringify({
    error: "Content exceeds tier limit",
    limit: limits.maxPasteSize,
    upgrade_url: "https://openpaste.vercel.app/pricing"
  }), { status: 413 });
}

if (storageUsed + contentSize > limits.totalStorage) {
  return new Response(JSON.stringify({
    error: "Storage quota exceeded",
    used: storageUsed,
    limit: limits.totalStorage
  }), { status: 507 });
}
```

---

## Part 4: Fix Clerk Webhook Bug

### Problem
In `clerk-webhook/index.ts`, the deletion logic queries `profile.id` but should use `clerk_user_id`.

### Current (Buggy)
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('clerk_user_id', user.id)
  .single();

// Then deletes using profile.id for shares/api_keys
await supabase.from('shares').delete().eq('user_id', profile.id);
```

### Fix
The `user_id` column in `shares` and `api_keys` now stores Clerk IDs (TEXT), not profile UUIDs.

```typescript
case 'user.deleted': {
  // Delete user's shares using Clerk ID directly
  await supabase.from('shares').delete().eq('user_id', user.id);
  
  // Delete user's API keys using Clerk ID directly
  await supabase.from('api_keys').delete().eq('user_id', user.id);
  
  // Delete the profile
  await supabase.from('profiles').delete().eq('clerk_user_id', user.id);
  
  console.log(`All data deleted for Clerk user: ${user.id}`);
  break;
}
```

---

## Part 5: Stripe Payment Integration

### Problem
No payment system for upgrading subscription tiers.

### Solution
Integrate Stripe for subscription billing.

### Implementation Steps

1. **Enable Stripe Integration**
   - Use Lovable's Stripe connector to set up the integration
   - This will provide access to Stripe tools and secrets

2. **Create Products in Stripe**
   - Pro Plan: $9.99/month
   - Business Plan: $29.99/month

3. **Create Checkout Edge Function**
   
   ```typescript
   // supabase/functions/create-checkout/index.ts
   import Stripe from 'https://esm.sh/stripe@14';
   
   const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
   
   Deno.serve(async (req) => {
     const { priceId, clerkUserId, email } = await req.json();
     
     const session = await stripe.checkout.sessions.create({
       mode: 'subscription',
       payment_method_types: ['card'],
       line_items: [{ price: priceId, quantity: 1 }],
       success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
       cancel_url: `${origin}/pricing`,
       client_reference_id: clerkUserId,
       customer_email: email,
       metadata: { clerkUserId },
     });
     
     return new Response(JSON.stringify({ url: session.url }));
   });
   ```

4. **Create Stripe Webhook Handler**
   
   ```typescript
   // supabase/functions/stripe-webhook/index.ts
   // Handle subscription events to update profiles.subscription_tier
   
   switch (event.type) {
     case 'checkout.session.completed':
       // Get clerkUserId from session metadata
       // Look up price ID to determine tier
       // Update profiles.subscription_tier
       break;
       
     case 'customer.subscription.updated':
       // Handle plan changes
       break;
       
     case 'customer.subscription.deleted':
       // Downgrade to free tier
       break;
   }
   ```

5. **Add Stripe Customer ID to Profiles**
   
   ```sql
   ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
   ```

---

## Part 6: Subscription Management Page

### Problem
No UI for users to view their tier, usage, or upgrade/downgrade.

### Solution
Create a new subscription management page.

### Create `src/pages/Subscription.tsx`

```typescript
export default function Subscription() {
  const { profile } = useUserProfile();
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan: {profile?.subscription_tier}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Storage usage progress bar */}
            <div>
              <p>Storage Used: {formatStorageLimit(profile?.storage_used)}</p>
              <Progress 
                value={(profile?.storage_used / tierLimits.totalStorage) * 100} 
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Plan Comparison */}
        <div className="grid md:grid-cols-3 gap-6">
          <PlanCard tier="free" current={profile?.subscription_tier === 'free'} />
          <PlanCard tier="pro" current={profile?.subscription_tier === 'pro'} />
          <PlanCard tier="business" current={profile?.subscription_tier === 'business'} />
        </div>
        
        {/* Billing History (if Stripe customer) */}
        {profile?.stripe_customer_id && <BillingHistory />}
      </div>
    </Layout>
  );
}
```

### Add Route

```typescript
// In App.tsx
<Route path="/subscription" element={<Subscription />} />
```

### Add Navigation Link

```typescript
// In Header.tsx, add link to subscription page
<Link to="/subscription">Subscription</Link>
```

---

## Part 7: Additional Improvements

### 7.1 Create Pricing Page

A public `/pricing` page showing tier comparison and pricing.

### 7.2 Storage Usage in Dashboard

Add storage usage indicator to the dashboard header.

```typescript
// In Dashboard.tsx
<Card>
  <p>Storage: {formatStorageLimit(profile?.storage_used)} / {formatStorageLimit(tierLimits.totalStorage)}</p>
  <Progress value={(profile?.storage_used / tierLimits.totalStorage) * 100} />
</Card>
```

### 7.3 Upgrade Prompts

When users hit limits, show upgrade prompts with links to the subscription page.

---

## Implementation Order

| Step | Task | Priority |
|------|------|----------|
| 1 | Fix Clerk webhook deletion bug | High |
| 2 | Add ownership verification in frontend delete operations | High |
| 3 | Implement storage tracking (increment on upload) | High |
| 4 | Implement storage tracking (decrement on delete) | High |
| 5 | Add tier enforcement to API edge function | High |
| 6 | Enable Stripe integration | High |
| 7 | Create checkout and webhook edge functions | High |
| 8 | Add `stripe_customer_id` to profiles | Medium |
| 9 | Create Subscription management page | Medium |
| 10 | Create Pricing page | Medium |
| 11 | Add storage usage to Dashboard | Low |
| 12 | Update RLS policies for tighter security | Low |

---

## Files to Create

| File | Description |
|------|-------------|
| `supabase/functions/create-checkout/index.ts` | Stripe checkout session creation |
| `supabase/functions/stripe-webhook/index.ts` | Handle Stripe subscription events |
| `src/pages/Subscription.tsx` | Subscription management UI |
| `src/pages/Pricing.tsx` | Public pricing page |
| `src/components/subscription/PlanCard.tsx` | Reusable plan display component |
| `src/components/subscription/BillingHistory.tsx` | Billing history component |
| `src/components/dashboard/StorageUsage.tsx` | Storage usage indicator |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/clerk-webhook/index.ts` | Fix deletion to use Clerk ID |
| `supabase/functions/api-pastes/index.ts` | Add tier limits, storage tracking |
| `src/components/upload/FileUploadForm.tsx` | Increment storage on upload |
| `src/components/dashboard/UserPastes.tsx` | Add ownership check, decrement storage |
| `src/components/dashboard/ImageGallery.tsx` | Add ownership check, decrement storage |
| `src/components/dashboard/ApiKeyManager.tsx` | Add ownership check |
| `src/pages/ViewPaste.tsx` | Decrement storage on burn-after-read |
| `src/pages/Dashboard.tsx` | Add storage usage display |
| `src/App.tsx` | Add new routes |
| `src/components/layout/Header.tsx` | Add subscription link |
| `supabase/config.toml` | Add new edge function configs |

---

## Database Changes

```sql
-- Add Stripe customer ID to profiles
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
```

---

## Technical Notes

### Stripe Secret Requirement
After enabling Stripe, you'll need to provide:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

### Clerk-Supabase ID Mapping
Since the system uses Clerk IDs stored as TEXT in `user_id` columns, all ownership checks compare `user_id` with `user?.id` from the `useAuth()` hook which returns the Clerk user ID.

### Storage Calculation
Storage is calculated as the sum of `file_size` for all files owned by a user. Text pastes are tracked by content byte length when needed for API-created pastes.
