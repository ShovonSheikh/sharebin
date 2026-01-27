

# Update Pricing to $3.99/$9.99 with Clerk Billing Integration

## Summary

This plan updates the pricing structure to the new lower pricing ($3.99/mo for Pro, $9.99/mo for Business) and updates the PLAN_FEATURES to accurately reflect file type limits as shown in the revised pricing structure.

---

## Revised Pricing Structure (from image)

| Plan | Price | Image | Video | Document | Archive | Storage |
|------|-------|-------|-------|----------|---------|---------|
| **Free** | $0 | 10 MB | 50 MB | 25 MB | 50 MB | 500 MB |
| **Pro** | $3.99/mo | 25 MB | 500 MB | 100 MB | 200 MB | 10 GB |
| **Business** | $9.99/mo | 50 MB | 2 GB | 250 MB | 500 MB | Unlimited |

---

## Files to Modify

### 1. `src/pages/Subscription.tsx`

**Update PLAN_FEATURES constant (lines 13-29):**

```typescript
const PLAN_FEATURES = {
  free: {
    icon: Zap,
    price: '$0',
    features: [
      '10 MB images',
      '50 MB videos',
      '25 MB documents',
      '50 MB archives',
      '500 MB total storage',
      'API access',
      'Burn after read',
    ],
  },
  pro: {
    icon: Crown,
    price: '$3.99/mo',
    features: [
      '25 MB images',
      '500 MB videos',
      '100 MB documents',
      '200 MB archives',
      '10 GB total storage',
      'Password protection',
      'Priority support',
    ],
  },
  business: {
    icon: Building,
    price: '$9.99/mo',
    features: [
      '50 MB images',
      '2 GB videos',
      '250 MB documents',
      '500 MB archives',
      'Unlimited storage',
      'Custom expiration times',
      'Team sharing (coming soon)',
    ],
  },
};
```

**Additionally:**
- Import `CheckoutButton` and `SubscriptionDetailsButton` from `@clerk/clerk-react/experimental`
- Replace disabled "Upgrade" buttons with `<CheckoutButton planId="..." />` components
- Add `<SubscriptionDetailsButton />` for paid plan users to manage their subscription
- Update footer text to indicate Clerk Billing is integrated

### 2. `src/lib/tierLimits.ts`

**Update tier descriptions:**
- `free.description`: "Get started with basic file sharing"
- `pro.description`: "Expanded limits for regular users"
- `business.description`: "Unlimited storage for power users and teams"

### 3. Create `src/pages/Pricing.tsx` (New File)

A public pricing page using Clerk's `<PricingTable />` component that automatically displays all plans configured in Clerk Dashboard.

### 4. `src/App.tsx`

Add route for the new Pricing page:
```typescript
<Route path="/pricing" element={<Pricing />} />
```

### 5. `src/components/layout/Header.tsx`

Add a "Pricing" link visible to all users (signed in or out).

---

## Implementation Order

1. Update `src/lib/tierLimits.ts` - Update descriptions
2. Update `src/pages/Subscription.tsx` - New PLAN_FEATURES with correct limits and Clerk Billing components
3. Create `src/pages/Pricing.tsx` - Public pricing page with PricingTable
4. Update `src/App.tsx` - Add /pricing route
5. Update `src/components/layout/Header.tsx` - Add Pricing link

---

## Manual Setup Required After Code Changes

1. **In Clerk Dashboard → Billing Settings:**
   - Enable Billing
   - Connect Stripe (use development gateway for testing)

2. **Create Plans in Clerk Dashboard → Subscription Plans:**
   - **Pro Plan**: $3.99/month with features:
     - 25 MB images, 500 MB videos, 100 MB documents, 200 MB archives, 10 GB storage
   - **Business Plan**: $9.99/month with features:
     - 50 MB images, 2 GB videos, 250 MB documents, 500 MB archives, Unlimited storage

3. **Copy Plan IDs** (format: `cplan_xxx`) and update:
   - `CheckoutButton planId` props in `Subscription.tsx`
   - `mapPlanToTier()` in `clerk-webhook/index.ts`

4. **Configure Webhook** (if not already done):
   - Endpoint: `https://gcwllpqedjcihrzexixq.supabase.co/functions/v1/clerk-webhook`
   - Events: `user.created`, `user.updated`, `user.deleted`, `subscription.created`, `subscription.updated`, `subscription.deleted`

