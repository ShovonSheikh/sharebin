import { SubscriptionTier } from './tierLimits';

export const FEATURES = {
  PASSWORD_PROTECTION: { minTier: 'pro' as SubscriptionTier },
  CUSTOM_EXPIRATION: { minTier: 'pro' as SubscriptionTier },
  PRIORITY_SUPPORT: { minTier: 'pro' as SubscriptionTier },
  LARGE_UPLOADS: { minTier: 'pro' as SubscriptionTier },
  TEAM_SHARING: { minTier: 'business' as SubscriptionTier, comingSoon: true },
} as const;

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
  const tier = FEATURES[featureKey].minTier;
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
