import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider, SignIn, SignUp } from '@clerk/clerk-react';
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ViewPaste from "./pages/ViewPaste";
import RawPaste from "./pages/RawPaste";
import EmbedPaste from "./pages/EmbedPaste";
import Dashboard from "./pages/Dashboard";
import Subscription from "./pages/Subscription";
import Pricing from "./pages/Pricing";
import ApiDocs from "./pages/ApiDocs";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/layout/Layout";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

// Custom auth pages with Layout
function SignInPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <SignIn 
          routing="path" 
          path="/sign-in" 
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-card border border-border shadow-lg",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "bg-secondary border-border text-foreground hover:bg-secondary/80",
              formFieldLabel: "text-foreground",
              formFieldInput: "bg-secondary border-border text-foreground",
              footerActionLink: "text-primary hover:text-primary/80",
              identityPreview: "bg-secondary border-border",
              identityPreviewText: "text-foreground",
              identityPreviewEditButton: "text-primary",
            },
          }}
        />
      </div>
    </Layout>
  );
}

function SignUpPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <SignUp 
          routing="path" 
          path="/sign-up" 
          signInUrl="/sign-in"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-card border border-border shadow-lg",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "bg-secondary border-border text-foreground hover:bg-secondary/80",
              formFieldLabel: "text-foreground",
              formFieldInput: "bg-secondary border-border text-foreground",
              footerActionLink: "text-primary hover:text-primary/80",
            },
          }}
        />
      </div>
    </Layout>
  );
}

const App = () => (
  <ClerkProvider 
    publishableKey={clerkPubKey}
    appearance={{
      variables: {
        colorPrimary: 'hsl(142.1 76.2% 36.3%)',
        colorBackground: 'hsl(240 10% 3.9%)',
        colorInputBackground: 'hsl(240 3.7% 15.9%)',
        colorInputText: 'hsl(0 0% 98%)',
        colorText: 'hsl(0 0% 98%)',
        colorTextSecondary: 'hsl(240 5% 64.9%)',
        borderRadius: '0.5rem',
      },
    }}
  >
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/p/:id" element={<ViewPaste />} />
              <Route path="/raw/:id" element={<RawPaste />} />
              <Route path="/embed/:id" element={<EmbedPaste />} />
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/docs" element={<ApiDocs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
