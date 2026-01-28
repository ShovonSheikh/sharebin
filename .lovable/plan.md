
# Fix Clerk Styling and Add Feature Gating by Plan

## Summary

This plan addresses two issues:
1. **Fix Clerk component styling** - The current green primary color and dark harsh styling doesn't match the app's orange theme
2. **Add feature gating** - Lock certain features behind Pro and Business plans to enforce the pricing tiers

---

## Part 1: Fix Clerk Component Styling

### Problem
The ClerkProvider is using:
- Green primary color: `hsl(142.1 76.2% 36.3%)` (green)
- Dark backgrounds that appear "harsh" and don't blend with the app's theme

The app uses an **orange theme** with primary color `hsl(24 95% 55%)` (~#e86e21).

### Solution
Update the `ClerkProvider` appearance configuration in `src/App.tsx` to match the app's color scheme:

**Current:**
```typescript
appearance={{
  variables: {
    colorPrimary: 'hsl(142.1 76.2% 36.3%)',  // Green
    colorBackground: 'hsl(240 10% 3.9%)',     // Very dark
    // ...
  },
}}
```

**Updated:**
```typescript
appearance={{
  variables: {
    colorPrimary: 'hsl(24 95% 55%)',           // Orange (matches --primary)
    colorBackground: 'hsl(220 20% 10%)',       // App background
    colorInputBackground: 'hsl(220 15% 18%)',  // App secondary
    colorInputText: 'hsl(210 20% 95%)',        // App foreground
    colorText: 'hsl(210 20% 95%)',             // App foreground
    colorTextSecondary: 'hsl(210 15% 60%)',    // App muted-foreground
    colorDanger: 'hsl(0 70% 50%)',             // App destructive
    colorSuccess: 'hsl(142 70% 45%)',          // App success
    borderRadius: '0.5rem',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  elements: {
    card: 'bg-card border border-border shadow-lg',
    primaryButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
    formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
}}
```

### Files to Modify
- `src/App.tsx` - Update ClerkProvider appearance variables
- Also add `checkoutProps` appearance to `CheckoutButton` components in `Subscription.tsx`
- Add `appearance` prop to `PricingTable` in `Pricing.tsx`

---

## Part 2: Add Feature Gating by Plan

### Features by Tier

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Basic file uploads | Yes | Yes | Yes |
| API access | Yes | Yes | Yes |
| Burn after read | Yes | Yes | Yes |
| Password protection | No | Yes | Yes |
| Custom expiration times | Limited | Yes | Yes |
| Large file uploads | No | Yes | Yes |
| Priority support | No | Yes | Yes |
| Team sharing | No | No | Coming Soon |

### Implementation Approach

Since we're using the database `subscription_tier` field (synced via webhook), we'll check the user's tier from the profile and conditionally enable/disable features.

### Files to Modify

#### 1. `src/components/upload/FileUploadForm.tsx`

Add feature gating for password protection:

```typescript
const canUsePasswordProtection = userTier !== 'free';

// In the password input section:
{canUsePasswordProtection ? (
  <div className="flex-1 space-y-2">
    <Label>Password Protection</Label>
    <Input
      type="password"
      placeholder="Optional password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
  </div>
) : (
  <div className="flex-1 space-y-2 opacity-50">
    <Label className="flex items-center gap-2">
      Password Protection
      <Badge variant="outline" className="text-xs">Pro</Badge>
    </Label>
    <Input disabled placeholder="Upgrade to Pro for password protection" />
  </div>
)}
```

#### 2. `src/components/paste/CreatePasteForm.tsx`

Apply the same password protection gating for text pastes.

#### 3. Create `src/lib/featureGating.ts` (New File)

A utility file for checking feature access:

```typescript
import { SubscriptionTier } from './tierLimits';

export const FEATURES = {
  PASSWORD_PROTECTION: { minTier: 'pro' as SubscriptionTier },
  CUSTOM_EXPIRATION: { minTier: 'pro' as SubscriptionTier },
  PRIORITY_SUPPORT: { minTier: 'pro' as SubscriptionTier },
  LARGE_UPLOADS: { minTier: 'pro' as SubscriptionTier },
  TEAM_SHARING: { minTier: 'business' as SubscriptionTier, comingSoon: true },
};

const TIER_ORDER: SubscriptionTier[] = ['free', 'pro', 'business'];

export function hasFeature(
  userTier: SubscriptionTier,
  featureKey: keyof typeof FEATURES
): boolean {
  const feature = FEATURES[featureKey];
  const userTierIndex = TIER_ORDER.indexOf(userTier);
  const requiredTierIndex = TIER_ORDER.indexOf(feature.minTier);
  return userTierIndex >= requiredTierIndex;
}

export function getFeatureUpgradeTier(featureKey: keyof typeof FEATURES): string {
  return FEATURES[featureKey].minTier.charAt(0).toUpperCase() + 
         FEATURES[featureKey].minTier.slice(1);
}
```

#### 4. `src/components/paste/CreatePasteForm.tsx`

Apply feature gating to password protection:

```typescript
import { hasFeature, getFeatureUpgradeTier, FEATURES } from '@/lib/featureGating';

// In component:
const canUsePassword = hasFeature(userTier, 'PASSWORD_PROTECTION');

// Disable password field and show upgrade prompt if not available
```

---

## Part 3: Add Custom Expiration Gating

For free users, limit expiration options. Pro and Business get all options.

### Modify `src/lib/constants.ts`

Add tier-based expiration filtering:

```typescript
export function getExpirationOptionsForTier(tier: SubscriptionTier) {
  const freeOptions = ['1h', '1d', '7d', 'never'];
  
  if (tier === 'free') {
    return EXPIRATION_OPTIONS.filter(opt => freeOptions.includes(opt.value));
  }
  return EXPIRATION_OPTIONS; // All options for paid users
}
```

---

## Implementation Summary

### Files to Create
| File | Description |
|------|-------------|
| `src/lib/featureGating.ts` | Feature access checking utilities |

### Files to Modify
| File | Changes |
|------|---------|
| `src/App.tsx` | Update ClerkProvider appearance with orange theme |
| `src/pages/Subscription.tsx` | Add checkoutProps appearance to CheckoutButton |
| `src/pages/Pricing.tsx` | Add appearance prop to PricingTable |
| `src/components/upload/FileUploadForm.tsx` | Gate password protection feature |
| `src/components/paste/CreatePasteForm.tsx` | Gate password protection feature |
| `src/lib/constants.ts` | Add tier-based expiration options function |

---

## Color Mapping Reference

| App Variable | HSL Value | Clerk Variable |
|--------------|-----------|----------------|
| `--background` | `220 20% 10%` | `colorBackground` |
| `--foreground` | `210 20% 95%` | `colorText` |
| `--primary` | `24 95% 55%` | `colorPrimary` |
| `--secondary` | `220 15% 18%` | `colorInputBackground` |
| `--muted-foreground` | `210 15% 60%` | `colorTextSecondary` |
| `--destructive` | `0 70% 50%` | `colorDanger` |
| `--border` | `220 15% 22%` | N/A (use elements) |

---

## UI Changes

### Password Protection (Free User View)
- Field appears disabled/grayed out
- Shows "Pro" badge next to label
- Placeholder text: "Upgrade to Pro for password protection"

### Password Protection (Pro/Business User View)
- Field is fully functional
- No upgrade prompts shown

### Expiration Options (Free User)
- Limited to: 1 hour, 1 day, 7 days, Never
- Shows subtle note: "More options with Pro"

### Expiration Options (Pro/Business User)
- All options available: 10 min, 1 hour, 1 day, 7 days, 30 days, 1 year, Never
