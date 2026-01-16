export type SubscriptionTier = 'free' | 'pro' | 'business';

export interface TierLimits {
  image: number;
  video: number;
  document: number;
  archive: number;
  totalStorage: number;
  label: string;
  description: string;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    image: 10 * 1024 * 1024,        // 10 MB
    video: 50 * 1024 * 1024,        // 50 MB
    document: 25 * 1024 * 1024,     // 25 MB
    archive: 50 * 1024 * 1024,      // 50 MB
    totalStorage: 500 * 1024 * 1024, // 500 MB
    label: 'Free',
    description: 'Basic file sharing with essential features',
  },
  pro: {
    image: 25 * 1024 * 1024,         // 25 MB
    video: 500 * 1024 * 1024,        // 500 MB
    document: 100 * 1024 * 1024,     // 100 MB
    archive: 200 * 1024 * 1024,      // 200 MB
    totalStorage: 10 * 1024 * 1024 * 1024, // 10 GB
    label: 'Pro',
    description: 'Enhanced limits for power users',
  },
  business: {
    image: 50 * 1024 * 1024,         // 50 MB
    video: 2 * 1024 * 1024 * 1024,   // 2 GB
    document: 250 * 1024 * 1024,     // 250 MB
    archive: 500 * 1024 * 1024,      // 500 MB
    totalStorage: Infinity,           // Unlimited
    label: 'Business',
    description: 'Maximum limits for teams and enterprises',
  },
};

export function formatStorageLimit(bytes: number): string {
  if (!isFinite(bytes)) return 'Unlimited';
  
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function getTierUpgradeMessage(currentTier: SubscriptionTier, requiredSize: number, contentType: string): string {
  const tierOrder: SubscriptionTier[] = ['free', 'pro', 'business'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  for (let i = currentIndex + 1; i < tierOrder.length; i++) {
    const nextTier = tierOrder[i];
    const nextLimits = TIER_LIMITS[nextTier];
    const limit = nextLimits[contentType as keyof TierLimits] as number;
    
    if (typeof limit === 'number' && requiredSize <= limit) {
      return `Upgrade to ${nextLimits.label} to upload files up to ${formatStorageLimit(limit)}`;
    }
  }
  
  return 'This file exceeds maximum allowed size';
}
