import { Layout } from '@/components/layout/Layout';
import { PricingTable } from '@clerk/clerk-react';
import { SignedOut } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Pricing() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your needs
            </p>
          </div>
          
          {/* Clerk Pricing Table - handles all the billing UI */}
          <PricingTable />
          
          <SignedOut>
            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">
                Sign up to get started with a free account
              </p>
              <Link to="/sign-up">
                <Button size="lg">Get Started Free</Button>
              </Link>
            </div>
          </SignedOut>
        </div>
      </div>
    </Layout>
  );
}
