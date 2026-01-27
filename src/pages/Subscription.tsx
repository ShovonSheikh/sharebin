import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { TIER_LIMITS, formatStorageLimit } from '@/lib/tierLimits';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { CheckoutButton, SubscriptionDetailsButton } from '@clerk/clerk-react/experimental';
import { Link } from 'react-router-dom';
import { Crown, Zap, Building, Check, ArrowLeft } from 'lucide-react';

// TODO: Replace with actual Clerk plan IDs after creating plans in Clerk Dashboard
const CLERK_PLAN_IDS = {
  pro: 'cplan_38pjHQQb8yLiiVMAJ01aSWmB0IC',
  business: 'cplan_38pjahklnVTDgDIU9jnDUQtgTrp',
};

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

function SubscriptionContent() {
  const { profile, isLoading } = useUserProfile();
  const currentTier = (profile?.subscription_tier || 'free') as keyof typeof TIER_LIMITS;
  const tierLimits = TIER_LIMITS[currentTier];
  const storageUsed = profile?.storage_used || 0;
  const storagePercentage = isFinite(tierLimits.totalStorage) 
    ? Math.min(100, (storageUsed / tierLimits.totalStorage) * 100)
    : 0;

  const isPaidUser = currentTier !== 'free';

  if (isLoading) {
    return <div className="container mx-auto px-4 py-20 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">Manage your plan and usage</p>
        </div>

        {/* Current Plan */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Plan: <Badge variant="default" className="text-sm">{tierLimits.label}</Badge>
            </CardTitle>
            <CardDescription>{tierLimits.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Storage Used</span>
                <span>{formatStorageLimit(storageUsed)} / {formatStorageLimit(tierLimits.totalStorage)}</span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
            </div>
            {isPaidUser && (
              <div className="pt-2">
                <SubscriptionDetailsButton>
                  <Button variant="outline" size="sm">
                    Manage Subscription
                  </Button>
                </SubscriptionDetailsButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {(Object.entries(PLAN_FEATURES) as [keyof typeof PLAN_FEATURES, typeof PLAN_FEATURES.free][]).map(([tier, plan]) => {
            const Icon = plan.icon;
            const isCurrentPlan = tier === currentTier;
            const canUpgrade = tier !== 'free' && !isCurrentPlan;
            
            return (
              <Card key={tier} className={`bg-card border-border ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="capitalize">{tier}</CardTitle>
                  </div>
                  <CardDescription className="text-2xl font-bold text-foreground">{plan.price}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isCurrentPlan ? (
                    <Button disabled className="w-full">Current Plan</Button>
                  ) : canUpgrade ? (
                    <CheckoutButton planId={CLERK_PLAN_IDS[tier as 'pro' | 'business']}>
                      <Button className="w-full">
                        Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </Button>
                    </CheckoutButton>
                  ) : (
                    <SubscriptionDetailsButton>
                      <Button variant="outline" className="w-full">
                        Manage Plan
                      </Button>
                    </SubscriptionDetailsButton>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Powered by Clerk Billing. Contact support for enterprise plans.
        </p>
      </div>
    </div>
  );
}

export default function Subscription() {
  return (
    <Layout>
      <SignedIn>
        <SubscriptionContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </Layout>
  );
}
